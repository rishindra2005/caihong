import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/config/auth';
import mongoose from 'mongoose';
import Project from '@/lib/db/models/Projects';
import fs from 'fs/promises';
import path from 'path';

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

// Helper function to check if a file is text-based
function isTextFile(filePath: string, buffer: Buffer): boolean {
  // First check file extension
  const ext = path.extname(filePath).toLowerCase();
  
  // List of known binary file extensions that should never be opened as text
  const binaryExtensions = new Set([
    // Compressed files
    '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz',
    // Executable binaries
    '.exe', '.dll', '.so', '.dylib', '.bin', '.dat',
    // Media file formats
    '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.tif', '.webp',
    '.mp3', '.wav', '.ogg', '.mp4', '.avi', '.mov', '.flv', '.mkv',
    // Application-specific binaries
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.psd', '.ai', '.eps', '.indd',
    // Database files
    '.db', '.sqlite', '.mdb', '.accdb',
    // Other binary formats
    '.iso', '.class', '.o', '.a'
  ]);
  
  // If it's a known binary format, return false immediately
  if (binaryExtensions.has(ext)) {
    return false;
  }
  
  // Comprehensive list of known text file extensions - these should always be opened as text
  const textExtensions = new Set([
    // Web development
    '.txt', '.md', '.html', '.htm', '.css', '.scss', '.sass', '.less',
    '.js', '.jsx', '.ts', '.tsx', '.json', '.xml', '.svg', '.yaml', '.yml',
    // Programming languages
    '.py', '.pyw', '.pyx', '.pyi', '.java', '.c', '.cpp', '.cc', '.h', '.hpp',
    '.cs', '.go', '.rs', '.rb', '.php', '.pl', '.pm', '.swift', '.kt', '.scala',
    '.lua', '.r', '.dart', '.sql',
    // Shell scripts
    '.sh', '.bash', '.ps1', '.psm1', '.bat', '.cmd',
    // Config files
    '.ini', '.conf', '.cfg', '.toml', '.properties', '.env',
    '.gitignore', '.gitattributes', '.gitmodules', '.dockerignore',
    // LaTeX
    '.tex', '.bib', '.aux', '.log', '.out',
    // Other text formats
    '.csv', '.tsv', '.graphql', '.prisma', '.editorconfig', '.eslintrc',
    '.prettierrc', '.stylelintrc', '.babelrc', '.npmrc', '.yarnrc'
  ]);
  
  // If it's a known text format, return true immediately
  if (textExtensions.has(ext)) {
    return true;
  }

  // For unknown extensions, analyze file content for binary data
  // Look for null bytes and high concentration of non-ASCII chars
  const sampleSize = Math.min(buffer.length, 4096); // Check up to 4KB
  let nullCount = 0;
  let nonAsciiCount = 0;
  let controlCharCount = 0; // Non-printable chars except for newlines, tabs, etc.
  
  const allowedControlChars = new Set([9, 10, 13]); // tab, LF, CR
  
  for (let i = 0; i < sampleSize; i++) {
    const byte = buffer[i];
    if (byte === 0) nullCount++;
    
    // Count non-ASCII bytes
    if (byte > 127) nonAsciiCount++;
    
    // Count control characters (0-31) except for allowed ones
    if (byte < 32 && !allowedControlChars.has(byte)) {
      controlCharCount++;
    }
  }

  // Calculate ratios
  const nullRatio = nullCount / sampleSize;
  const nonAsciiRatio = nonAsciiCount / sampleSize;
  const controlCharRatio = controlCharCount / sampleSize;
  
  // Files with any null bytes are likely binary
  if (nullRatio > 0) {
    return false;
  }
  
  // Files with too many control characters are likely binary
  if (controlCharRatio > 0.05) {
    return false;
  }
  
  // Allow higher threshold for non-ASCII characters to support UTF-8 text
  // Most programming files should be <30% non-ASCII
  return nonAsciiRatio < 0.3;
}

// GET: Read file content
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

    // Await params before using its properties
    const paramsCopy = await Promise.resolve(params);
    const projectId = paramsCopy.projectId;

    const project = await verifyProjectAccess(projectId, session.user.id);
    const projectRoot = path.join(process.env.PROJECT_PATH!, project.projectPath);
    const fullPath = validatePath(projectRoot, filePath);

    // Read file as buffer first
    const buffer = await fs.readFile(fullPath);
    
    // Check if it's a text file
    if (!isTextFile(filePath, buffer)) {
      return NextResponse.json({ 
        error: 'Cannot open binary file. Please download instead.' 
      }, { status: 400 });
    }

    // Convert to string and check for valid UTF-8
    try {
      const content = buffer.toString('utf-8');
      return NextResponse.json({ content });
    } catch (error) {
      return NextResponse.json({ 
        error: 'File encoding not supported. Only UTF-8 text files are supported.' 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Read file error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to read file' 
    }, { status: 500 });
  }
}

// PUT: Update file content
export async function PUT(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { path: filePath, content } = await request.json();
    if (!filePath || typeof content !== 'string') {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // Await params before using its properties
    const paramsCopy = await Promise.resolve(params);
    const projectId = paramsCopy.projectId;

    const project = await verifyProjectAccess(projectId, session.user.id);
    const projectRoot = path.join(process.env.PROJECT_PATH!, project.projectPath);
    const fullPath = validatePath(projectRoot, filePath);

    await fs.writeFile(fullPath, content, 'utf-8');

    // Update project size
    const stats = await fs.stat(fullPath);
    project.size = stats.size;
    await project.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Write file error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to write file' 
    }, { status: 500 });
  }
} 