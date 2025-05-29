import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/config/auth';
import path from 'path';
import simpleGit, { SimpleGit } from 'simple-git';
import { verifyProjectAccess } from '@/lib/utils/projectUtils';

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract project ID from params
    const { projectId } = params;
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Verify project access
    const projectPath = await verifyProjectAccess(session.user.id, projectId);
    if (!projectPath) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { commitHash, filePath } = body;

    if (!commitHash) {
      return NextResponse.json({ error: 'Commit hash is required' }, { status: 400 });
    }

    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }

    // Initialize git
    const git: SimpleGit = simpleGit(projectPath);

    // Check if this is a valid commit
    try {
      await git.show([commitHash]);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid commit hash' }, { status: 400 });
    }

    try {
      // Check if the file exists in the commit
      try {
        await git.show([`${commitHash}:${filePath}`]);
      } catch (error) {
        return NextResponse.json({ error: 'File does not exist in specified commit' }, { status: 400 });
      }

      // Get file content from the commit
      const fileContentOutput = await git.show([`${commitHash}:${filePath}`]);
      const fileContent = fileContentOutput.toString();
      
      return NextResponse.json({ 
        success: true, 
        content: fileContent
      });
    } catch (error) {
      console.error('Error getting file at commit:', error);
      return NextResponse.json({ error: 'Failed to get file content' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in file-at-commit endpoint:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 