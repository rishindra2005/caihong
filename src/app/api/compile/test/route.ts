import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/config/auth';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

const execPromise = promisify(exec);

// Define proper types for our results object
interface CompilerInfo {
  installed: boolean;
  path?: string;
  version?: string | null;
  error?: string;
}

interface CompilationResult {
  status: 'success' | 'error';
  file_created?: boolean;
  stdout?: string;
  stderr?: string;
  error?: string;
}

interface TestDirectories {
  status?: 'success' | 'error';
  error?: string;
  compilation?: CompilationResult;
}

interface TestResults {
  environment: {
    os: string;
    version: string;
    node: string;
    PROJECT_PATH: string;
    TEXCOST: string;
  };
  compilers: Record<string, CompilerInfo>;
  test_directories: TestDirectories;
  overall_status: 'success' | 'partial' | 'failure' | 'unknown';
}

export async function GET() {
  console.log("LaTeX compiler test endpoint called");
  
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const results: TestResults = {
    environment: {
      os: os.type(),
      version: os.release(),
      node: process.version,
      PROJECT_PATH: process.env.PROJECT_PATH || 'Not set',
      TEXCOST: process.env.TEXCOST || 'Not set'
    },
    compilers: {},
    test_directories: {},
    overall_status: 'unknown'
  };
  
  try {
    // Check for LaTeX compilers
    const compilers = ['pdflatex', 'xelatex', 'lualatex'];
    
    for (const compiler of compilers) {
      try {
        const { stdout } = await execPromise(`which ${compiler}`);
        results.compilers[compiler] = {
          installed: true,
          path: stdout.trim(),
          version: null
        };
        
        // Try to get version
        try {
          const { stdout: versionOutput } = await execPromise(`${compiler} --version`);
          const versionMatch = versionOutput.match(/Version\s+([^\s]+)/);
          if (versionMatch && versionMatch[1]) {
            results.compilers[compiler].version = versionMatch[1];
          } else {
            results.compilers[compiler].version = 'Unknown';
          }
        } catch (versionError) {
          results.compilers[compiler].version = 'Error: ' + String(versionError).substring(0, 100);
        }
      } catch (error) {
        results.compilers[compiler] = {
          installed: false,
          error: String(error).substring(0, 100)
        };
      }
    }
    
    // Check PROJECT_PATH
    if (!process.env.PROJECT_PATH) {
      results.test_directories.status = 'error';
      results.test_directories.error = 'PROJECT_PATH environment variable is not set';
    } else {
      try {
        await fs.access(process.env.PROJECT_PATH);
        
        // Create a test directory
        const testDir = path.join(process.env.PROJECT_PATH, 'test-compilation');
        try {
          await fs.mkdir(testDir, { recursive: true });
          
          // Create a test LaTeX file
          const testFile = path.join(testDir, 'test.tex');
          const latexContent = `
\\documentclass{article}
\\begin{document}
Hello, world! This is a test LaTeX document.
\\end{document}
          `;
          
          await fs.writeFile(testFile, latexContent);
          
          // Try to compile it
          try {
            const { stdout, stderr } = await execPromise(`cd "${testDir}" && pdflatex -interaction=nonstopmode test.tex`);
            
            // Check if PDF was created
            try {
              await fs.access(path.join(testDir, 'test.pdf'));
              results.test_directories.compilation = {
                status: 'success',
                file_created: true,
                stdout: stdout.substring(0, 200) + '...'
              };
            } catch (pdfError) {
              results.test_directories.compilation = {
                status: 'error',
                file_created: false,
                error: 'PDF file was not created',
                stderr: stderr.substring(0, 200) + '...'
              };
            }
            
            // Clean up (but don't fail if cleanup fails)
            try {
              await fs.rm(testDir, { recursive: true, force: true });
            } catch (cleanupError) {
              console.error('Cleanup error (non-fatal):', cleanupError);
            }
            
          } catch (compileError) {
            results.test_directories.compilation = {
              status: 'error',
              error: String(compileError).substring(0, 200) + '...'
            };
          }
          
        } catch (mkdirError) {
          results.test_directories.status = 'error';
          results.test_directories.error = 'Could not create test directory: ' + String(mkdirError).substring(0, 100);
        }
      } catch (accessError) {
        results.test_directories.status = 'error';
        results.test_directories.error = 'PROJECT_PATH does not exist or is not accessible: ' + String(accessError).substring(0, 100);
      }
    }
    
    // Determine overall status
    let hasCompiler = false;
    for (const compiler in results.compilers) {
      if (results.compilers[compiler].installed) {
        hasCompiler = true;
        break;
      }
    }
    
    if (hasCompiler && results.test_directories.compilation?.status === 'success') {
      results.overall_status = 'success';
    } else if (hasCompiler) {
      results.overall_status = 'partial';
    } else {
      results.overall_status = 'failure';
    }
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('LaTeX test error:', error);
    return NextResponse.json({ 
      error: 'LaTeX test failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      partial_results: results
    }, { status: 500 });
  }
} 