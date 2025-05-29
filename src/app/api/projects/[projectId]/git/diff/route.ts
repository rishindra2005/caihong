import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/config/auth';
import mongoose from 'mongoose';
import Project from '@/lib/db/models/Projects';
import path from 'path';
import { getFileDiff } from '@/lib/utils/gitUtils';

// POST /api/projects/[projectId]/git/diff - Get diff for file between commits
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { filePath, commitHash, prevCommitHash } = await request.json();
    
    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }
    
    await mongoose.connect(process.env.MONGODB_URI!);
    
    // Verify project access
    const project = await Project.findOne({
      _id: params.projectId,
      $or: [
        { owner: session.user.id },
        { collaborators: session.user.id }
      ]
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get Git settings from project
    const gitEnabled = project.settings.get('gitEnabled') !== false;
    
    if (!gitEnabled) {
      return NextResponse.json({ 
        error: 'Git is disabled for this project'
      }, { status: 400 });
    }

    // Get the project path
    const projectRoot = path.join(process.env.PROJECT_PATH!, project.projectPath);
    
    // Get file diff
    const diff = await getFileDiff(
      projectRoot,
      filePath,
      commitHash || 'HEAD',
      prevCommitHash || ''
    );

    return NextResponse.json({ diff });
  } catch (error) {
    console.error('Git diff error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Git diff failed' 
    }, { status: 500 });
  }
} 