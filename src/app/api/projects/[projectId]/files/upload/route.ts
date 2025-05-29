import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/config/auth';
import mongoose from 'mongoose';
import Project from '@/lib/db/models/Projects';
import fs from 'fs/promises';
import path from 'path';
import { calculateDirectorySize, wouldExceedSizeLimit } from '@/lib/utils/fileUtils';

// Helper function to verify project access
async function verifyProjectAccess(projectId: string, userId: string) {
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

  return project;
}

// Helper function to validate path is within project directory
function validatePath(basePath: string, targetPath: string) {
  const resolvedPath = path.resolve(basePath, targetPath);
  if (!resolvedPath.startsWith(basePath)) {
    throw new Error('Invalid path: Access denied');
  }
  return resolvedPath;
}

// POST: Handle file upload
export async function POST(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadPath = formData.get('path') as string;

    if (!file || !uploadPath) {
      return NextResponse.json({ error: 'File and path are required' }, { status: 400 });
    }

    const project = await verifyProjectAccess(params.projectId, session.user.id);
    const projectRoot = path.join(process.env.PROJECT_PATH!, project.projectPath);

    // Check current project size against the project's storage limit
    const currentSize = await calculateDirectorySize(projectRoot);
    if (currentSize >= project.storageLimit) {
      const limitInMB = Math.round(project.storageLimit / (1024 * 1024));
      return NextResponse.json({ 
        error: `Project size limit (${limitInMB}MB) reached. Delete some files to proceed.` 
      }, { status: 400 });
    }

    // Check if upload would exceed size limit
    if (await wouldExceedSizeLimit(projectRoot, file.size, project.storageLimit)) {
      const limitInMB = Math.round(project.storageLimit / (1024 * 1024));
      return NextResponse.json({ 
        error: `Upload would exceed project size limit (${limitInMB}MB)` 
      }, { status: 400 });
    }

    const fullPath = validatePath(projectRoot, uploadPath);
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(fullPath, buffer);

    // Update project size in MongoDB
    project.size = await calculateDirectorySize(projectRoot);
    await project.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to upload file' 
    }, { status: 500 });
  }
} 