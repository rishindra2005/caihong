import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/config/auth';
import mongoose from 'mongoose';
import Project from '@/lib/db/models/Projects';
import path from 'path';
import {
  initializeGit,
  getGitStatus,
  commitChanges,
  getCommitHistory,
  getFileDiff
} from '@/lib/utils/gitUtils';

// GET /api/projects/[projectId]/git - Get git status and commit history
export async function GET(
  request: NextRequest,
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
    
    // Verify project access
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

    // Get Git settings from project
    const gitEnabled = project.settings.get('gitEnabled') !== false;
    
    if (!gitEnabled) {
      return NextResponse.json({ 
        gitEnabled: false,
        status: { hasChanges: false, modifiedFiles: [] },
        commits: []
      });
    }

    // Get the project path
    const projectRoot = path.join(process.env.PROJECT_PATH!, project.projectPath);
    
    // Get user info for git operations
    const userName = session.user.name || 'User';
    const userEmail = session.user.email || 'user@example.com';
    
    // Initialize Git if not already initialized
    await initializeGit(projectRoot, userName, userEmail);
    
    // Get Git status and history
    const [status, commits] = await Promise.all([
      getGitStatus(projectRoot),
      getCommitHistory(projectRoot)
    ]);

    return NextResponse.json({ 
      gitEnabled,
      status,
      commits
    });
  } catch (error) {
    console.error('Git operation error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Git operation failed' 
    }, { status: 500 });
  }
}

// POST /api/projects/[projectId]/git - Commit changes
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { message } = await request.json();
    await mongoose.connect(process.env.MONGODB_URI!);
    
    // Await params before using its properties
    const paramsCopy = await Promise.resolve(params);
    const projectId = paramsCopy.projectId;
    
    // Verify project access
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

    // Get Git settings from project
    const gitEnabled = project.settings.get('gitEnabled') !== false;
    
    if (!gitEnabled) {
      return NextResponse.json({ 
        success: false,
        error: 'Git is disabled for this project'
      }, { status: 400 });
    }

    // Get the project path
    const projectRoot = path.join(process.env.PROJECT_PATH!, project.projectPath);
    
    // Get user info for commit
    const userName = session.user.name || 'User';
    const userEmail = session.user.email || 'user@example.com';
    
    // Initialize Git if not already initialized
    await initializeGit(projectRoot, userName, userEmail);
    
    // Commit changes
    const commitMessage = message || `Changes by ${userName}`;
    const success = await commitChanges(projectRoot, commitMessage, userName, userEmail);

    return NextResponse.json({ success });
  } catch (error) {
    console.error('Git commit error:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Git commit failed' 
    }, { status: 500 });
  }
} 