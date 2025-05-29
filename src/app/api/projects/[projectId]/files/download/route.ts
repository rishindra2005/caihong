import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/config/auth';
import Project from '@/lib/db/models/Projects';
import fs from 'fs/promises';
import path from 'path';
import archiver from 'archiver';
import { createReadStream } from 'fs';
import { Readable } from 'stream';

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

// GET: Download file or folder
export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');
    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }

    const project = await verifyProjectAccess(params.projectId, session.user.id);
    const projectRoot = path.join(process.env.PROJECT_PATH!, project.projectPath);
    const fullPath = validatePath(projectRoot, filePath);

    const stats = await fs.stat(fullPath);
    const isDirectory = stats.isDirectory();

    if (isDirectory) {
      // Create a zip file for directories
      const archive = archiver('zip', { zlib: { level: 9 } });
      const chunks: Buffer[] = [];

      archive.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      archive.on('warning', (err) => console.warn(err));
      archive.on('error', (err) => { throw err; });

      archive.directory(fullPath, path.basename(filePath));
      await archive.finalize();

      const zipBuffer = Buffer.concat(chunks);
      const stream = Readable.from(zipBuffer);

      const response = new NextResponse(stream as any);
      response.headers.set('Content-Type', 'application/zip');
      response.headers.set('Content-Disposition', `attachment; filename="${path.basename(filePath)}.zip"`);
      return response;
    } else {
      // For single files, stream directly
      const fileStream = createReadStream(fullPath);
      const response = new NextResponse(fileStream as any);
      response.headers.set('Content-Type', 'application/octet-stream');
      response.headers.set('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
      return response;
    }
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to download' 
    }, { status: 500 });
  }
} 