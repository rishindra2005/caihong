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

// Helper function to calculate directory size
async function calculateDirSize(dirPath: string): Promise<number> {
  let size = 0;
  const items = await fs.readdir(dirPath, { withFileTypes: true });
  
  for (const item of items) {
    const itemPath = path.join(dirPath, item.name);
    if (item.isFile()) {
      const stats = await fs.stat(itemPath);
      size += stats.size;
    } else if (item.isDirectory()) {
      size += await calculateDirSize(itemPath);
    }
  }
  
  return size;
}

// POST: Create file/directory or paste
export async function POST(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { type, parentPath, name, sourcePaths, operation } = await request.json();
    const project = await verifyProjectAccess(params.projectId, session.user.id);
    const projectRoot = path.join(process.env.PROJECT_PATH!, project.projectPath);

    // Check current project size
    const currentSize = await calculateDirectorySize(projectRoot);
    if (currentSize >= project.storageLimit) {
      const limitInMB = Math.round(project.storageLimit / (1024 * 1024));
      return NextResponse.json({ 
        error: `Project size limit (${limitInMB}MB) reached. Delete some files to proceed.` 
      }, { status: 400 });
    }

    if (type === 'paste') {
      // Handle paste operation for multiple files
      const isMultiple = Array.isArray(sourcePaths) && sourcePaths.length > 1;
      const paths = Array.isArray(sourcePaths) ? sourcePaths : [sourcePaths];
      
      if (paths.length === 0) {
        return NextResponse.json({ error: 'No source paths provided' }, { status: 400 });
      }

      let totalSourceSize = 0;
      const sourceStats = [];
      
      // First, validate all paths and calculate total size
      try {
        for (const sourcePath of paths) {
          const sourceFullPath = validatePath(projectRoot, sourcePath);
          // Check if source path exists
          const stats = await fs.stat(sourceFullPath).catch(() => null);
          if (!stats) {
            return NextResponse.json({ 
              error: `Source path does not exist: ${path.basename(sourcePath)}` 
            }, { status: 400 });
          }
          
          // Calculate size
          const sourceSize = stats.isDirectory() 
            ? await calculateDirectorySize(sourceFullPath)
            : stats.size;
          
          totalSourceSize += sourceSize;
          sourceStats.push({ path: sourcePath, stats, sourceFullPath });
        }
        
        // For copy operations, check if size would exceed limit BEFORE copying
        if (operation === 'copy' && await wouldExceedSizeLimit(projectRoot, totalSourceSize, project.storageLimit)) {
          const limitInMB = Math.round(project.storageLimit / (1024 * 1024));
          return NextResponse.json({ 
            error: `Operation would exceed project size limit (${limitInMB}MB)` 
          }, { status: 400 });
        }
        
        // Now perform the operations after all validations passed
        for (const source of sourceStats) {
          const fileName = path.basename(source.path);
          // Ensure parentPath is a string
          const targetParentPath = typeof parentPath === 'string' ? parentPath : '';
          const targetPath = path.join(targetParentPath, fileName);
          const targetFullPath = validatePath(projectRoot, targetPath);
          
          // Check if target already exists
          const targetExists = await fs.stat(targetFullPath).catch(() => null);
          if (targetExists) {
            // Handle conflict - potentially append a number or return an error
            // For now, we'll simply return an error
            return NextResponse.json({ 
              error: `A file or folder with the name "${fileName}" already exists at the destination` 
            }, { status: 400 });
          }

          if (operation === 'cut') {
            await fs.rename(source.sourceFullPath, targetFullPath);
          } else {
            // Copy operation
            if (source.stats.isDirectory()) {
              await copyDir(source.sourceFullPath, targetFullPath);
            } else {
              await fs.copyFile(source.sourceFullPath, targetFullPath);
            }
          }
        }
      } catch (error) {
        console.error('Paste operation error:', error);
        return NextResponse.json({ 
          error: error instanceof Error ? `Paste failed: ${error.message}` : 'Paste operation failed' 
        }, { status: 500 });
      }
    } else {
      // Handle create operation
      // Normalize the parent path to ensure consistent handling with empty strings
      const normalizedParentPath = parentPath || '';
      // Join the parent path and name using proper path handling
      const fullPath = validatePath(projectRoot, path.join(normalizedParentPath, name));
      
      try {
        // Check if the path's directory exists before creating the file/folder
        const parentDir = path.dirname(fullPath);
        const parentDirExists = await fs.stat(parentDir).catch(() => null);
        
        if (!parentDirExists && normalizedParentPath) {
          // Create parent directories if they don't exist
          await fs.mkdir(parentDir, { recursive: true });
        }

        // Check if the file/directory already exists
        const exists = await fs.stat(fullPath).catch(() => null);
        if (exists) {
          return NextResponse.json({ 
            error: `A ${type} with the name "${name}" already exists` 
          }, { status: 400 });
        }
        
        if (type === 'directory') {
          await fs.mkdir(fullPath, { recursive: true });
        } else {
          // Ensure parent directory exists
          await fs.mkdir(path.dirname(fullPath), { recursive: true });
          await fs.writeFile(fullPath, '');
        }
      } catch (error) {
        console.error('Create operation error:', error);
        return NextResponse.json({ 
          error: error instanceof Error ? `Create failed: ${error.message}` : 'Create operation failed' 
        }, { status: 500 });
      }
    }

    // Update project size in MongoDB
    project.size = await calculateDirectorySize(projectRoot);
    await project.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('File operation error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to perform operation' 
    }, { status: 500 });
  }
}

// Helper function to copy directory recursively
async function copyDir(src: string, dest: string) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

// PATCH: Rename file/directory
export async function PATCH(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { oldPath, newName } = await request.json();
    const project = await verifyProjectAccess(params.projectId, session.user.id);
    
    const projectRoot = path.join(process.env.PROJECT_PATH!, project.projectPath);
    const oldFullPath = validatePath(projectRoot, oldPath);
    const newFullPath = validatePath(projectRoot, path.join(path.dirname(oldPath), newName));

    await fs.rename(oldFullPath, newFullPath);

    // Update project size
    const newSize = await calculateDirSize(projectRoot);
    project.size = newSize;
    await project.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Rename error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to rename item' 
    }, { status: 500 });
  }
}

// DELETE: Delete file/directory
export async function DELETE(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { paths } = await request.json();
    const project = await verifyProjectAccess(params.projectId, session.user.id);
    const projectRoot = path.join(process.env.PROJECT_PATH!, project.projectPath);

    // Handle multiple paths or single path
    const itemPaths = Array.isArray(paths) ? paths : [paths];
    
    for (const itemPath of itemPaths) {
      const fullPath = validatePath(projectRoot, itemPath);
      
      const stats = await fs.stat(fullPath);
      if (stats.isDirectory()) {
        await fs.rm(fullPath, { recursive: true });
      } else {
        await fs.unlink(fullPath);
      }
    }

    // Update project size
    const newSize = await calculateDirSize(projectRoot);
    project.size = newSize;
    await project.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to delete item' 
    }, { status: 500 });
  }
} 