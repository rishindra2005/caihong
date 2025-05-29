import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/config/auth';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import simpleGit, { SimpleGit } from 'simple-git';
import { verifyProjectAccess } from '@/lib/utils/projectUtils';

// POST /api/projects/[projectId]/git/revert - Revert file or entire commit
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
    const { commitHash, filePath, revertType, resetMode, checkoutMode } = body;

    if (!commitHash) {
      return NextResponse.json({ error: 'Commit hash is required' }, { status: 400 });
    }

    if (!revertType || !['file', 'version'].includes(revertType)) {
      return NextResponse.json({ error: 'Valid revert type (file or version) is required' }, { status: 400 });
    }

    // Initialize git
    const git: SimpleGit = simpleGit(projectPath);

    // Check if this is a valid commit
    try {
      await git.show([commitHash]);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid commit hash' }, { status: 400 });
    }

    // Handle file revert
    if (revertType === 'file') {
      if (!filePath) {
        return NextResponse.json({ error: 'File path is required for file revert' }, { status: 400 });
      }

      const absoluteFilePath = path.join(projectPath, filePath);
      
      // Ensure file path is within project directory (security check)
      if (!absoluteFilePath.startsWith(projectPath)) {
        return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
      }

      try {
        // Check if the file exists in the commit
        try {
          await git.show([`${commitHash}:${filePath}`]);
        } catch (error) {
          return NextResponse.json({ error: 'File does not exist in specified commit' }, { status: 400 });
        }

        // Determine the checkout approach based on the checkout mode
        const mode = checkoutMode || 'checkout';
        
        // Perform the appropriate checkout operation
        switch (mode) {
          case 'checkout-force':
            // Force checkout even if there are local changes
            await git.checkout([commitHash, '--', filePath]);
            break;
            
          case 'stage':
            // Checkout and stage the file
            await git.checkout([commitHash, '--', filePath]);
            await git.add([filePath]);
            break;
            
          case 'checkout':
          default:
            // Standard checkout (will fail if there are local changes)
            try {
              await git.checkout([commitHash, '--', filePath]);
            } catch (error) {
              // If checkout fails due to local changes, return an appropriate error
              if (String(error).includes('local changes')) {
                return NextResponse.json({ 
                  error: 'Cannot checkout file: You have local changes. Use force checkout or commit your changes first.' 
                }, { status: 409 });
              }
              throw error; // Re-throw for other errors
            }
            break;
        }
        
        return NextResponse.json({ 
          success: true, 
          message: `Successfully reverted ${filePath} to version ${commitHash.substring(0, 7)}`,
          checkoutMode: mode
        });
      } catch (error) {
        console.error('Error reverting file:', error);
        return NextResponse.json({ error: `Failed to revert file: ${error}` }, { status: 500 });
      }
    }
    
    // Handle version revert
    else if (revertType === 'version') {
      try {
        // Check if resetMode is valid
        const validResetModes = ['soft', 'mixed', 'hard'];
        const mode = resetMode && validResetModes.includes(resetMode) ? resetMode : 'mixed';
        
        // Use git reset with the specified mode instead of revert
        if (mode === 'soft') {
          await git.reset(['--soft', commitHash]);
        } else if (mode === 'hard') {
          await git.reset(['--hard', commitHash]);
        } else {
          // Default is mixed
          await git.reset(['--mixed', commitHash]);
        }
        
        return NextResponse.json({ 
          success: true, 
          message: `Successfully reset to version ${commitHash.substring(0, 7)} using ${mode} mode` 
        });
      } catch (error) {
        console.error('Error resetting to version:', error);
        
        // Try to abort any ongoing operation
        try {
          await git.reset(['--hard', 'HEAD']);
        } catch (abortError) {
          console.error('Error aborting reset:', abortError);
        }
        
        return NextResponse.json({ error: 'Failed to reset to version' }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Invalid revert operation' }, { status: 400 });
  } catch (error) {
    console.error('Error in revert endpoint:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 