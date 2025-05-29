import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/config/auth';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs/promises';
import { spawn } from 'child_process';
import Project from '@/lib/db/models/Projects';
import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import { analyzeLatexCompilation } from '@/lib/utils/latexLogParser';
import { platform } from 'os';
import { getApiUrl } from '@/lib/config/api';
import { fetchWithProtocolFallback } from '@/lib/utils/fetch';

const execPromise = promisify(exec);
const TEXCOST = parseFloat(process.env.TEXCOST || '1');

// Add a new function to track active compilations
const activeCompilations = new Map<string, { process: any; timeout: NodeJS.Timeout }>();

// Hard cap on compilation time in seconds (regardless of credits)
const MAX_COMPILATION_TIME_CAP = 300;

// Function to kill a process and its children
async function killProcess(pid: number) {
  try {
    if (platform() === 'win32') {
      // On Windows, use taskkill to kill the process tree
      try {
        execSync(`taskkill /pid ${pid} /T /F`);
        console.log(`Successfully killed Windows process tree for PID ${pid}`);
      } catch (error) {
        console.error(`Failed to kill Windows process ${pid}:`, error);
        // Try alternative Windows process killing if the first method fails
        try {
          process.kill(pid, 'SIGTERM');
          console.log(`Killed Windows process ${pid} with SIGTERM`);
        } catch (termError) {
          console.error(`Failed to kill Windows process ${pid} with SIGTERM:`, termError);
        }
      }
    } else {
      // On Unix-like systems, try multiple approaches
      try {
        // First try to kill just the process
        process.kill(pid, 'SIGTERM');
        console.log(`Sent SIGTERM to process ${pid}`);
        
        // Give it a moment to terminate gracefully
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if process still exists
        try {
          process.kill(pid, 0);
          // If we get here, process still exists, try SIGKILL
          process.kill(pid, 'SIGKILL');
          console.log(`Sent SIGKILL to process ${pid}`);
        } catch (checkError) {
          // Process no longer exists, which is what we want
          console.log(`Process ${pid} was terminated successfully with SIGTERM`);
          return;
        }
      } catch (error) {
        console.error(`Initial process kill attempt failed for ${pid}:`, error);
        
        // Try killing the process group as a fallback
        try {
          process.kill(-pid, 'SIGKILL');
          console.log(`Sent SIGKILL to process group ${pid}`);
        } catch (groupError) {
          console.error(`Failed to kill process group ${pid}:`, groupError);
          
          // As a last resort, try using pkill command
          try {
            execSync(`pkill -P ${pid}`);
            console.log(`Used pkill to terminate process ${pid} and its children`);
          } catch (pkillError) {
            console.error(`Failed to pkill process ${pid}:`, pkillError);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in killProcess:', error);
    // Don't throw the error, just log it - we want the compilation to continue cleanup
  }
}

// Function to deduct credits - only called ONCE after process completion
async function deductCredits(request: NextRequest, amount: number, description: string, projectId: string) {
  // Skip deduction if amount is 0
  if (amount <= 0) {
    console.log("Skipping credit deduction as amount is", amount);
    return { success: true, data: { creditCharge: 0 } };
  }

  try {
    console.log(`Deducting ${amount} credits for: ${description}`);
    
    const creditApiUrl = getApiUrl('/api/credits/subtract', request.url);
    const creditResponse = await fetchWithProtocolFallback(creditApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify({
        amount: amount,
        description: description,
        projectId: projectId,
        action: 'tex-compile'
      })
    });

    const responseText = await creditResponse.text();
    let creditData;
    
    try {
      creditData = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse credit API response:", responseText);
      return { 
        success: false, 
        error: "Invalid response from credit API",
        details: responseText
      };
    }

    if (!creditResponse.ok) {
      console.error("Credit deduction failed:", creditData);
      return { 
        success: false, 
        error: creditData.error || 'Credit deduction failed',
        details: creditData
      };
    }
    
    console.log("Credits deducted successfully:", creditData);
    return { success: true, data: creditData };
  } catch (error) {
    console.error("Error during credit deduction:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Credit deduction failed',
      details: error
    };
  }
}

// Function to cleanup compilation resources
function cleanupCompilation(compilationId: string) {
  const compilation = activeCompilations.get(compilationId);
  if (compilation) {
    clearTimeout(compilation.timeout);
    activeCompilations.delete(compilationId);
    console.log(`Cleaned up compilation resources for ${compilationId}`);
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log("LaTeX compilation request received");
  
  const session = await getServerSession(authOptions);
  let childProcess: any = null;
  let compilationId: string = '';
  let wasCompilationAborted = false;
  let creditCharge = 0;

  try {
    const requestBody = await request.json();
    console.log("Compilation request body:", requestBody);
    
    const { filePath, compiler = 'pdflatex', flags = [], userCredits } = requestBody;
    
    // Validate credits properly
    if (typeof userCredits !== 'number' || isNaN(userCredits)) {
      console.error("Invalid credit value:", userCredits);
      return NextResponse.json({ 
        error: 'INSUFFICIENT_CREDITS', 
        details: 'Invalid credit information.',
        success: false 
      }, { status: 402 });
    }

    if (userCredits < 2) {
      console.error("User has insufficient credits:", userCredits);
      return NextResponse.json({ 
        error: 'INSUFFICIENT_CREDITS', 
        details: 'You need at least 2 credits to compile LaTeX documents.',
        success: false 
      }, { status: 402 });
    }

    // Generate a unique compilation ID
    compilationId = `${filePath}-${Date.now()}`;

    // Check if there's already a compilation running for this file
    if (activeCompilations.has(compilationId)) {
      console.log("Compilation already in progress for:", compilationId);
      return NextResponse.json({
        error: 'Compilation in progress',
        details: 'Another compilation is already running for this file',
        success: false
      }, { status: 409 });
    }

    // Calculate maximum compilation time based on available credits, but cap it
    // This means we don't promise more compilation time than the hard cap
    const creditBasedTime = Math.floor((userCredits / TEXCOST) * 0.8);
    const MAX_COMPILATION_TIME = Math.min(MAX_COMPILATION_TIME_CAP, creditBasedTime);
    console.log("Maximum compilation time:", MAX_COMPILATION_TIME, "seconds (capped at", MAX_COMPILATION_TIME_CAP, "seconds)");

    // Make sure MongoDB is connected
    if (!mongoose.connection.readyState) {
      console.log("Connecting to MongoDB");
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    // Get project ID from file path (first segment or from query parameter)
    console.log("Processing file path:", filePath);

    // Handle different file path formats
    let projectId: string;
    let relativePath: string;

    // Check if the filePath is already in the format "projectId/path/to/file.tex"
    if (filePath.includes('/')) {
      const segments = filePath.split('/');
      projectId = segments[0];
      relativePath = segments.slice(1).join('/');
      console.log("Extracted projectId and relativePath from filePath:", { projectId, relativePath });
    } else {
      // If there's no slash, the filePath might just be a filename
      // In this case, we would need a separate projectId parameter
      console.error("Invalid file path format (no directory separators):", filePath);
      return NextResponse.json({ error: 'Invalid file path format. Expected: projectId/path/to/file.tex' }, { status: 400 });
    }

    if (!projectId) {
      console.error("Could not extract projectId from filePath:", filePath);
      return NextResponse.json({ error: 'Could not extract project ID from file path' }, { status: 400 });
    }

    // Verify project exists and user has access
    console.log("Verifying project access");
    const project = await Project.findOne({
      _id: projectId,
      $or: [
        { owner: session?.user.id },
        { collaborators: session?.user.id }
      ]
    });

    if (!project) {
      console.error("Project not found or access denied:", projectId);
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }

    // Get the file name and directory
    const fileName = path.basename(relativePath);
    const fileDir = path.dirname(relativePath);
    console.log("File details:", { fileName, fileDir });
    
    // Ensure file has .tex extension
    if (!fileName.endsWith('.tex')) {
      console.error("Non-tex file compilation attempt:", fileName);
      return NextResponse.json({ error: 'Only .tex files can be compiled' }, { status: 400 });
    }

    // Get project path from environment variables
    console.log("PROJECT_PATH env:", process.env.PROJECT_PATH);

    // Verify PROJECT_PATH is set
    if (!process.env.PROJECT_PATH) {
      console.error("PROJECT_PATH environment variable is not set");
      return NextResponse.json({ 
        error: 'Server configuration error: PROJECT_PATH is not set',
        details: 'Please contact the administrator to set up the LaTeX compilation environment'
      }, { status: 500 });
    }

    const projectPath = path.join(process.env.PROJECT_PATH, projectId);
    // If fileDir is just '.', use the project path directly
    const fileFullPath = fileDir === '.' ? projectPath : path.join(projectPath, fileDir);
    console.log("Full file path:", fileFullPath);

    // Check if project directory exists
    try {
      await fs.access(projectPath);
      console.log("Project directory exists:", projectPath);
    } catch (error) {
      console.error("Project directory does not exist:", projectPath, error);
      try {
        // Try to create the project directory if it doesn't exist
        console.log("Attempting to create project directory");
        await fs.mkdir(projectPath, { recursive: true });
        console.log("Project directory created successfully");
      } catch (mkdirError) {
        console.error("Failed to create project directory:", mkdirError);
        return NextResponse.json({ 
          error: 'Project directory does not exist and could not be created',
          details: 'File system access error'
        }, { status: 500 });
      }
    }

    // Check if file directory exists
    try {
      await fs.access(fileFullPath);
      console.log("File directory exists:", fileFullPath);
    } catch (error) {
      console.error("File directory does not exist:", fileFullPath, error);
      try {
        // Try to create the file directory if it doesn't exist
        console.log("Attempting to create file directory");
        await fs.mkdir(fileFullPath, { recursive: true });
        console.log("File directory created successfully");
      } catch (mkdirError) {
        console.error("Failed to create file directory:", mkdirError);
        return NextResponse.json({ 
          error: 'File directory does not exist and could not be created',
          details: 'File system access error'
        }, { status: 500 });
      }
    }

    // Check if file exists
    try {
      const fileFinalPath = path.join(fileFullPath, fileName);
      console.log("Checking if file exists:", fileFinalPath);
      await fs.access(fileFinalPath);
      console.log("File exists, proceeding with compilation");
    } catch (error) {
      console.error("File not found:", path.join(fileFullPath, fileName), error);
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Choose compiler based on input
    let compilerCmd;
    switch (compiler.toLowerCase()) {
      case 'pdflatex':
        compilerCmd = 'pdflatex';
        break;
      case 'xelatex':
        compilerCmd = 'xelatex';
        break;
      case 'lualatex':
        compilerCmd = 'lualatex';
        break;
      default:
        compilerCmd = 'pdflatex'; // Default to pdflatex
    }
    console.log("Selected compiler:", compilerCmd);

    // Verify the compiler is installed
    try {
      console.log("Checking if compiler is installed");
      const { stdout } = await execPromise(`which ${compilerCmd}`);
      console.log(`Compiler ${compilerCmd} found at: ${stdout.trim()}`);
    } catch (error) {
      console.error(`Compiler ${compilerCmd} not found on system:`, error);
      return NextResponse.json({
        error: `LaTeX compiler '${compilerCmd}' is not installed on the server`,
        details: 'Please contact the administrator to install the required LaTeX compiler'
      }, { status: 500 });
    }

    // Build compiler command with flags
    // Don't add default flags anymore - only use what's provided from settings
    const processedFlags: string[] = [];

    // If flags is an array
    if (Array.isArray(flags)) {
      // Process each flag properly
      flags.forEach(flag => {
        if (typeof flag === 'string' && flag.trim()) {
          // Validate that the flag is properly formed (starts with - and doesn't contain malformed parts)
          const cleanFlag = flag.trim();
          
          // Check if this looks like a valid LaTeX compiler flag
          // It should start with a dash and not contain spaces
          if (cleanFlag.startsWith('-') && !cleanFlag.includes(' ')) {
            // Common flag names to check against for typos
            const commonFlags = [
              '-interaction',
              '-file-line-error',
              '-halt-on-error',
              '-shell-escape',
              '-synctex'
            ];
            
            // Check if it's a known flag or part of one (could be malformed)
            let isMalformed = false;
            
            // Check for malformed common flags (e.g. -interaco=something instead of -interaction=nonstopmode)
            for (const commonFlag of commonFlags) {
              // If it's a partial match but not an exact prefix, it's likely malformed
              if (cleanFlag.startsWith(commonFlag.substring(0, 5)) && 
                  !cleanFlag.startsWith(commonFlag) && 
                  cleanFlag.length > 4) {
                console.warn(`Skipping likely malformed flag: ${cleanFlag} (might be a corrupted version of ${commonFlag})`);
                isMalformed = true;
                break;
              }
            }
            
            if (!isMalformed) {
              processedFlags.push(cleanFlag);
            }
          } else {
            console.warn(`Skipping invalid flag format: ${cleanFlag}`);
          }
        }
      });
    } 
    // If flags is a string, convert to array
    else if (typeof flags === 'string') {
      // Similar validation for string flags
      if (flags.includes(' ')) {
        // Split the string and apply the same validation to each part
        flags.split(' ').forEach(flagPart => {
          const cleanFlag = flagPart.trim();
          if (cleanFlag.startsWith('-')) {
            processedFlags.push(cleanFlag);
          }
        });
      } else if (flags.trim().startsWith('-')) {
        processedFlags.push(flags.trim());
      }
    }

    // Remove any duplicates
    const uniqueFlags = [...new Set(processedFlags)];

    // Log the flags being used
    console.log("Using compiler flags:", uniqueFlags);

    // Ensure each flag is properly quoted if needed
    const quotedFlags = uniqueFlags.map(flag => {
      // If flag contains spaces, quote it
      return flag.includes(' ') ? `"${flag}"` : flag;
    }).join(' ');

    // Build the final command
    const command = `cd "${fileFullPath}" && ${compilerCmd} ${quotedFlags} "${fileName}"`;
    console.log("Executing command:", command);

    // REWRITTEN COMPILATION SECTION - Single timeout and single credit deduction
    console.log("Starting compilation process with timeout of", MAX_COMPILATION_TIME, "seconds");
    let stdout = '', stderr = '';
    let timeoutOccurred = false;
    
    // Create the compilation promise
    const compilationPromise = new Promise<{stdout: string; stderr: string; timedOut: boolean}>((resolve, reject) => {
      childProcess = exec(command, { maxBuffer: 5 * 1024 * 1024 }, (error, stdout, stderr) => {
        if (timeoutOccurred) {
          // Already handled by timeout
          return;
        }
        
        if (error) {
          console.error("Compilation error:", error.message);
          // We don't reject here - we still want to collect output
          resolve({ stdout, stderr, timedOut: false });
        } else {
          resolve({ stdout, stderr, timedOut: false });
        }
      });

      // Set a single timeout for the maximum allowed compilation time
      const timeoutHandle = setTimeout(async () => {
        if (childProcess && childProcess.pid) {
          console.log(`Compilation timeout reached after ${MAX_COMPILATION_TIME} seconds`);
          timeoutOccurred = true;
          wasCompilationAborted = true;
          
          try {
            await killProcess(childProcess.pid);
            console.log("Process killed successfully after timeout");
          } catch (killError) {
            console.error("Error killing process after timeout:", killError);
          }
          
          resolve({ 
            stdout: childProcess.stdout?.read() || stdout, 
            stderr: childProcess.stderr?.read() || stderr,
            timedOut: true 
          });
        }
      }, MAX_COMPILATION_TIME * 1000);

      activeCompilations.set(compilationId, {
        process: childProcess,
        timeout: timeoutHandle
      });
    });

    // Execute the compilation and wait for result
    console.log("Awaiting compilation result");
    const { stdout: compilationStdout, stderr: compilationStderr, timedOut } = await compilationPromise;
    
    // Store the stdout/stderr for later use
    stdout = compilationStdout || '';
    stderr = compilationStderr || '';
    
    // Clean up the compilation resources
    cleanupCompilation(compilationId);
    console.log("Compilation process completed, resources cleaned up");
    
    // Calculate compilation duration
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // in seconds
    console.log("Compilation duration:", duration, "seconds");
    
    // Calculate credit charge for the compilation
    // For timeouts, ensure we charge appropriately
    if (timedOut) {
      // For timeouts, we charge a minimum of 2 credits or based on the elapsed time, whichever is greater
      creditCharge = Math.max(2, Math.ceil(duration * TEXCOST));
      creditCharge = Math.min(creditCharge, userCredits); // Don't charge more than user has
      console.log("Timeout credit charge calculation:", { duration, TEXCOST, creditCharge });
    } 
    // For normal compilations, charge based on duration
    else if (duration > 2) {
      creditCharge = Math.ceil(duration * TEXCOST);
      creditCharge = Math.min(creditCharge, userCredits); // Don't charge more than user has
      console.log("Credit charge calculation:", { duration, TEXCOST, creditCharge });
    }
    
    // Check if PDF was created regardless of compilation success or timeout
    const pdfFileName = fileName.replace(/\.tex$/, '.pdf');
    const pdfPath = path.join(fileFullPath, pdfFileName);
    console.log("Checking for output PDF:", pdfPath);
    
    let pdfExists = false;
    try {
      await fs.access(pdfPath);
      pdfExists = true;
      console.log("PDF was created successfully");
    } catch (error) {
      console.error("PDF was not created:", error);
    }

    // Parse LaTeX log file to extract more detailed information
    const logFileName = fileName.replace(/\.tex$/, '.log');
    const logPath = path.join(fileFullPath, logFileName);
    console.log("Looking for log file:", logPath);
    
    let logContents = '';
    let errors: string[] = [];
    let warningsCount = 0;
    let badBoxesCount = 0;
    let compilationStatus = timedOut ? 'failure' : (pdfExists ? 'success' : 'failure');
    let needsRerun = false;
    let pageCount = 0;
    
    try {
      logContents = await fs.readFile(logPath, 'utf-8');
      console.log("Log file found, size:", logContents.length, "bytes");
      
      // Use our enhanced parser to analyze the log
      const analysis = analyzeLatexCompilation(logContents, pdfExists);
      
      // Extract data from the analysis
      compilationStatus = analysis.status;
      errors = analysis.errors;
      warningsCount = analysis.warnings.length;
      badBoxesCount = analysis.badBoxes.length;
      needsRerun = analysis.needsRerun;
      pageCount = analysis.pageCount;
      
      console.log("Compilation analysis:", {
        status: compilationStatus,
        errors: errors.length,
        warnings: warningsCount,
        badBoxes: badBoxesCount,
        pdfGenerated: pdfExists,
        pageCount: pageCount,
        needsRerun: needsRerun
      });
      
    } catch (error) {
      console.error("Log file not available:", error);
    }
    
    // Build the PDF path for response
    const pdfViewPath = pdfExists ? 
      `/api/projects/${projectId}/files/view?path=${encodeURIComponent(path.join(fileDir, pdfFileName))}` : 
      null;
      
    // DEDUCT CREDITS ONLY ONCE - after we know the compilation status and duration
    // Ensure we deduct credits for timeouts
    if (creditCharge > 0) {
      const creditDescription = timedOut 
        ? `LaTeX compilation timed out after ${duration.toFixed(1)}s` 
        : `${compilationStatus === 'success' ? 'Successfully compiled' : 'Compiled with errors'} ${fileName} (${duration.toFixed(1)}s)`;
      
      console.log("Deducting credits:", { creditCharge, description: creditDescription, timedOut });
      
      try {
        const deductionResult = await deductCredits(
          request,
          creditCharge,
          creditDescription,
          projectId
        );
        
        // Log the deduction result but don't fail the request if deduction fails
        if (!deductionResult.success) {
          console.warn("Credit deduction failed:", deductionResult.error);
        } else {
          console.log("Credit deduction successful:", deductionResult.data);
        }
      } catch (deductError) {
        // Catch any unexpected errors in the deduction process but continue
        console.error("Unexpected error during credit deduction:", deductError);
      }
    } else {
      console.log("No credits to deduct, creditCharge =", creditCharge);
    }

    // Prepare and return the response
    const response = {
      success: pdfExists,
      status: compilationStatus,
      compiler: compiler,
      duration: duration,
      creditCharge: creditCharge,
      timedOut: timedOut,
      maxTime: MAX_COMPILATION_TIME, // Include the max time in the response for UI
      logFileExcerpt: logContents.length > 5000 ? logContents.substring(0, 5000) + '...' : logContents,
      errors: errors,
      warningsCount: warningsCount,
      badBoxesCount: badBoxesCount,
      needsRerun: needsRerun,
      pageCount: pageCount,
      compilationStatus: compilationStatus,
      pdfPath: pdfViewPath,
      message: timedOut 
        ? `Compilation timed out after ${MAX_COMPILATION_TIME} seconds` 
        : compilationStatus === 'success' 
          ? 'Compilation successful' 
          : compilationStatus === 'partial' 
            ? `Compiled with ${errors.length} error${errors.length === 1 ? '' : 's'}, but PDF was generated` 
            : 'Compilation failed',
      type: timedOut 
        ? 'error' 
        : compilationStatus === 'success' 
          ? 'success' 
          : compilationStatus === 'partial' 
            ? 'warning' 
            : 'error'
    };
    
    return NextResponse.json(response, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    // Kill the child process if it exists
    if (childProcess && childProcess.pid) {
      await killProcess(childProcess.pid);
    }

    // Clean up compilation resources
    if (compilationId) {
      cleanupCompilation(compilationId);
    }

    // Calculate duration and credit charge for unexpected errors
    const duration = (Date.now() - startTime) / 1000;
    console.error('Unexpected LaTeX compilation error:', error);
    
    // We don't attempt to deduct credits here - avoid API calls during error handling
    
    return NextResponse.json({ 
      error: 'LaTeX compilation failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      duration: duration,
      creditCharge: 0, // Don't charge for unexpected errors
      success: false,
      status: 'failure'
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 