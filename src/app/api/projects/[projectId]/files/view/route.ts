import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/config/auth';
import mongoose from 'mongoose';
import Project from '@/lib/db/models/Projects';
import fs from 'fs/promises';
import path from 'path';
import { getMimeType } from '@/lib/utils/mediaUtils';

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

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const filePath = url.searchParams.get('path');
  
  if (!filePath) {
    return NextResponse.json({ error: 'File path is required' }, { status: 400 });
  }

  try {
    // Await params before using its properties
    const paramsCopy = await Promise.resolve(params);
    const projectId = paramsCopy.projectId;
    
    const project = await verifyProjectAccess(projectId, session.user.id);
    const projectRoot = path.join(process.env.PROJECT_PATH!, project.projectPath);
    const fullPath = validatePath(projectRoot, filePath);
    
    // Check if the file exists
    const stats = await fs.stat(fullPath);
    if (!stats.isFile()) {
      return NextResponse.json({ error: 'Not a file' }, { status: 400 });
    }

    // Read the file
    const fileBuffer = await fs.readFile(fullPath);
    
    // Get content type using utility function
    const contentType = getMimeType(filePath);
    
    // Create a response with proper content type for viewing
    const response = new NextResponse(fileBuffer);
    response.headers.set('Content-Type', contentType);
    response.headers.set('Content-Length', stats.size.toString());
    
    // Use inline content disposition to view in browser rather than download
    response.headers.set('Content-Disposition', `inline; filename="${path.basename(filePath)}"`);
    
    return response;
  } catch (error) {
    console.error('File view error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to view file' 
    }, { status: 500 });
  }
} 