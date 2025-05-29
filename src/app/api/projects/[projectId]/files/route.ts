import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/config/auth';
import mongoose from 'mongoose';
import Project from '@/lib/db/models/Projects';
import File from '@/lib/db/models/File';
import fs from 'fs/promises';
import path from 'path';

interface FileSystemItem {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileSystemItem[];
}

// Helper function to verify project access and check storage limit
async function verifyProjectAccess(projectId: string, userId: string, requiredSpace: number = 0) {
  const project = await Project.findOne({
    _id: projectId,
    $or: [
      { owner: userId },
      { collaborators: userId }
    ]
  });

  if (!project) {
    throw new Error('Project not found or unauthorized');
  }

  // Check storage limit if requiredSpace is provided
  if (requiredSpace > 0) {
    const projectRoot = path.join(process.env.PROJECT_PATH!, project.projectPath);
    const currentSize = await calculateDirectorySize(projectRoot);
    
    if (currentSize + requiredSpace > project.storageLimit) {
      throw new Error('Storage limit exceeded');
    }
  }

  return project;
}

// Helper function to build file system tree
async function buildFileSystemTree(basePath: string, relativePath: string = ''): Promise<FileSystemItem[]> {
  const items = await fs.readdir(path.join(basePath, relativePath), { withFileTypes: true });
  const result: FileSystemItem[] = [];

  for (const item of items) {
    const itemPath = path.join(relativePath, item.name);
    if (item.isDirectory()) {
      const children = await buildFileSystemTree(basePath, itemPath);
      result.push({
        name: item.name,
        type: 'directory',
        path: itemPath,
        children
      });
    } else {
      result.push({
        name: item.name,
        type: 'file',
        path: itemPath
      });
    }
  }

  // Sort directories first, then files, both alphabetically
  return result.sort((a, b) => {
    if (a.type === b.type) {
      return a.name.localeCompare(b.name);
    }
    return a.type === 'directory' ? -1 : 1;
  });
}

// Helper function to calculate directory size
async function calculateDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0;
  const items = await fs.readdir(dirPath, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dirPath, item.name);
    if (item.isDirectory()) {
      totalSize += await calculateDirectorySize(fullPath);
    } else {
      const stats = await fs.stat(fullPath);
      totalSize += stats.size;
    }
  }

  return totalSize;
}

export async function POST(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    // Await params before using its properties
    const paramsCopy = await Promise.resolve(params);
    const projectId = paramsCopy.projectId;
    const { name, type, path, parent } = await request.json();
    
    const project = await Project.findOne({
      _id: projectId,
      $or: [
        { owner: session.user.id },
        { collaborators: session.user.id }
      ]
    });
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Create the new file/directory
    const newFile = await File.create({
      name,
      type,
      path,
      content: '',  // Always provide a default empty content
      project: project._id,
      parent: parent || null,
      children: type === 'directory' ? [] : undefined
    });

    // If this is a nested file/folder, update the parent
    if (parent) {
      const updatedParent = await File.findByIdAndUpdate(
        parent,
        { $push: { children: newFile._id } },
        { new: true }
      ).populate('children');

      return NextResponse.json({
        parent: JSON.parse(JSON.stringify(updatedParent))
      });
    }

    return NextResponse.json({
      file: JSON.parse(JSON.stringify(newFile))
    });

  } catch (error) {
    console.error('File creation error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create file' 
    }, { status: 500 });
  }
}

// GET: Get file system tree
export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Await params before using its properties
    const paramsCopy = await Promise.resolve(params);
    const projectId = paramsCopy.projectId;
    
    const project = await verifyProjectAccess(projectId, session.user.id);
    const projectRoot = path.join(process.env.PROJECT_PATH!, project.projectPath);
    
    // Create project directory if it doesn't exist
    await fs.mkdir(projectRoot, { recursive: true });
    
    const fileSystem = await buildFileSystemTree(projectRoot);
    const projectSize = await calculateDirectorySize(projectRoot);

    // Update project size in database
    await Project.findByIdAndUpdate(projectId, { size: projectSize });

    return NextResponse.json({ 
      fileSystem, 
      projectSize,
      storageLimit: project.storageLimit 
    });
  } catch (error) {
    console.error('File system error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to get file system' 
    }, { status: 500 });
  }
}