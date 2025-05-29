import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/config/auth';
import path from 'path';
import fs from 'fs/promises';

export async function POST(request: NextRequest) {
  console.log("Debug endpoint called");
  
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get the request body
    const body = await request.json();
    console.log("Debug request body:", body);
    
    const { filePath, projectId } = body;
    
    // Parse the file path
    let parsedProjectId = '';
    let relativePath = '';
    
    if (filePath) {
      if (filePath.includes('/')) {
        const segments = filePath.split('/');
        parsedProjectId = segments[0];
        relativePath = segments.slice(1).join('/');
      } else {
        relativePath = filePath;
      }
    }
    
    // Check if PROJECT_PATH environment variable is set
    const projectPathEnv = process.env.PROJECT_PATH || 'Not set';
    
    // Create response object with debug information
    const response = {
      input: {
        filePath,
        projectId
      },
      parsed: {
        projectId: parsedProjectId,
        relativePath,
        fileName: path.basename(relativePath || ''),
        fileDir: path.dirname(relativePath || '')
      },
      environment: {
        PROJECT_PATH: projectPathEnv,
        requestUrl: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers)
      },
      calculatedPaths: {
        projectPath: projectId ? path.join(projectPathEnv, projectId) : 'No projectId provided',
        fullFilePath: projectId && relativePath ? 
          path.join(projectPathEnv, projectId, path.dirname(relativePath)) : 
          'Missing projectId or relativePath'
      },
      session: {
        userId: session.user.id,
        isAuthenticated: !!session
      }
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ 
      error: 'Debug request failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 