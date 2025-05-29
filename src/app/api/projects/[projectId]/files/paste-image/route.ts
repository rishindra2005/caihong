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

export async function POST(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { imageData, fileName, directoryPath } = await request.json();
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

    // Decode base64 image data (remove the data:image/png;base64, part)
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Calculate image size
    const imageSize = buffer.length;
    
    // Check if adding this image would exceed the size limit
    if (await wouldExceedSizeLimit(projectRoot, imageSize, project.storageLimit)) {
      const limitInMB = Math.round(project.storageLimit / (1024 * 1024));
      return NextResponse.json({ 
        error: `Operation would exceed project size limit (${limitInMB}MB)` 
      }, { status: 400 });
    }

    // Ensure the file has valid extension
    let finalFileName = fileName;
    if (!fileName.includes('.')) {
      // Determine extension from the image data
      if (imageData.startsWith('data:image/png;')) {
        finalFileName += '.png';
      } else if (imageData.startsWith('data:image/jpeg;') || imageData.startsWith('data:image/jpg;')) {
        finalFileName += '.jpg';
      } else if (imageData.startsWith('data:image/gif;')) {
        finalFileName += '.gif';
      } else if (imageData.startsWith('data:image/webp;')) {
        finalFileName += '.webp';
      } else {
        finalFileName += '.png'; // Default to PNG
      }
    }

    // Create the full path for the file
    const fullPath = validatePath(projectRoot, path.join(directoryPath || '', finalFileName));
    
    // Check if the file already exists
    const exists = await fs.stat(fullPath).catch(() => null);
    if (exists) {
      // Add a number to the filename to make it unique
      const ext = path.extname(finalFileName);
      const basename = path.basename(finalFileName, ext);
      const timestamp = Date.now();
      finalFileName = `${basename}_${timestamp}${ext}`;
      
      // Create the new unique path
      const uniquePath = validatePath(projectRoot, path.join(directoryPath || '', finalFileName));
      await fs.writeFile(uniquePath, buffer);
    } else {
      // Write the file to disk
      await fs.writeFile(fullPath, buffer);
    }

    // Update project size in MongoDB
    project.size = await calculateDirectorySize(projectRoot);
    await project.save();

    return NextResponse.json({ 
      success: true,
      fileName: finalFileName
    });
  } catch (error) {
    console.error('Image paste error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to paste image' 
    }, { status: 500 });
  }
} 