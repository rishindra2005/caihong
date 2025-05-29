import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/config/auth';
import path from 'path';
import fs from 'fs/promises';
import Project from '@/lib/db/models/Projects';
import { parseLatexLogs } from '@/lib/utils/latexLogParser';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.error("Unauthorized log fetch attempt");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { filePath, projectId } = await request.json();
    
    if (!filePath || !projectId) {
      return NextResponse.json({ error: 'Missing file path or project ID' }, { status: 400 });
    }

    console.log("Fetching logs for file:", filePath, "in project:", projectId);

    // Verify project access
    const project = await Project.findOne({
      _id: projectId,
      $or: [
        { owner: session.user.id },
        { collaborators: session.user.id }
      ]
    });

    if (!project) {
      console.error("Project not found or access denied:", projectId);
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }

    // Create the log file path by replacing .tex extension with .log
    // Handle file paths with or without project ID prefix
    let relativePath = filePath;
    
    // If the path starts with the project ID, remove it
    if (relativePath.startsWith(projectId + '/')) {
      relativePath = relativePath.substring(projectId.length + 1);
    }
    
    // Replace .tex with .log
    const logFileName = relativePath.replace(/\.tex$/, '.log');
    console.log("Log file name:", logFileName);
    
    // Construct full path to the log file
    const projectPath = path.join(process.env.PROJECT_PATH!, projectId);
    const logFilePath = path.join(projectPath, logFileName);
    console.log("Full log file path:", logFilePath);

    try {
      // Check if log file exists
      await fs.access(logFilePath);
      console.log("Log file exists, reading content");
      
      // Read log file
      const logContents = await fs.readFile(logFilePath, 'utf-8');
      
      // Check if PDF exists for more accurate status information
      const pdfFilePath = path.join(projectPath, relativePath.replace(/\.tex$/, '.pdf'));
      let pdfExists = false;
      
      try {
        await fs.access(pdfFilePath);
        pdfExists = true;
      } catch (e) {
        // PDF doesn't exist, that's ok
        pdfExists = false;
      }
      
      // Parse the log file with the enhanced parser
      const parsedLog = parseLatexLogs(logContents);
      console.log("Log parsed successfully");
      
      return NextResponse.json({
        success: true,
        logContents: logContents,
        parsed: parsedLog,
        pdfExists
      });
    } catch (error) {
      console.error("Error reading log file:", error);
      return NextResponse.json({ 
        success: false,
        error: 'Log file not found or cannot be read',
        details: error instanceof Error ? error.message : 'Unknown error',
        path: logFilePath
      }, { status: 404 });
    }
  } catch (error) {
    console.error('Error fetching LaTeX logs:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch LaTeX logs', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 