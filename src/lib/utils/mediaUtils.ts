import path from 'path';

// Get MIME type based on file extension
export function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  
  switch (ext) {
    // Document formats
    case '.pdf':
      return 'application/pdf';
    case '.doc':
    case '.docx':
      return 'application/msword';
    case '.xls':
    case '.xlsx':
      return 'application/vnd.ms-excel';
    case '.ppt':
    case '.pptx':
      return 'application/vnd.ms-powerpoint';
      
    // Image formats
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.gif':
      return 'image/gif';
    case '.svg':
      return 'image/svg+xml';
    case '.webp':
      return 'image/webp';
    case '.bmp':
      return 'image/bmp';
    case '.tiff':
    case '.tif':
      return 'image/tiff';
    case '.ico':
      return 'image/x-icon';
      
    // Video formats
    case '.mp4':
      return 'video/mp4';
    case '.webm':
      return 'video/webm';
    case '.avi':
      return 'video/x-msvideo';
    case '.mov':
    case '.qt':
      return 'video/quicktime';
    case '.flv':
      return 'video/x-flv';
    case '.wmv':
      return 'video/x-ms-wmv';
    case '.mkv':
      return 'video/x-matroska';
    case '.mpeg':
    case '.mpg':
      return 'video/mpeg';
    case '.m4v':
      return 'video/x-m4v';
    case '.3gp':
      return 'video/3gpp';
    case '.3g2':
      return 'video/3gpp2';
    case '.ts.video':
    case '.mts':
      return 'video/mp2t';
      
    // Audio formats
    case '.mp3':
      return 'audio/mpeg';
    case '.wav':
      return 'audio/wav';
    case '.ogg':
      return 'audio/ogg';
    case '.aac':
      return 'audio/aac';
    case '.flac':
      return 'audio/flac';
    case '.m4a':
      return 'audio/x-m4a';
    case '.wma':
      return 'audio/x-ms-wma';
    case '.opus':
      return 'audio/opus';
    case '.mid':
    case '.midi':
      return 'audio/midi';
      
    // Programming Languages
    case '.py':
    case '.pyw':
    case '.pyx':
    case '.pyi':
      return 'text/x-python';
    case '.java':
      return 'text/x-java';
    case '.c':
      return 'text/x-c';
    case '.cpp':
    case '.cc':
    case '.cxx':
      return 'text/x-c++';
    case '.h':
    case '.hpp':
      return 'text/x-h';
    case '.cs':
      return 'text/x-csharp';
    case '.go':
      return 'text/x-go';
    case '.rs':
      return 'text/x-rust';
    case '.rb':
      return 'text/x-ruby';
    case '.php':
      return 'text/x-php';
    case '.pl':
    case '.pm':
      return 'text/x-perl';
    case '.swift':
      return 'text/x-swift';
    case '.scala':
      return 'text/x-scala';
    case '.kt':
    case '.kts':
      return 'text/x-kotlin';
    case '.dart':
      return 'text/x-dart';
    case '.lua':
      return 'text/x-lua';
    case '.sh':
    case '.bash':
      return 'text/x-sh';
    case '.ps1':
    case '.psm1':
      return 'text/x-powershell';
    case '.r':
      return 'text/x-r';
    case '.sql':
      return 'text/x-sql';
    
    // Code and text formats  
    case '.tex':
      return 'application/x-tex';
    case '.bib':
      return 'application/x-bibtex';
    case '.md':
      return 'text/markdown';
    case '.json':
      return 'application/json';
    case '.js':
      return 'application/javascript';
    case '.mjs':
      return 'application/javascript';
    case '.ts':
      return 'application/typescript';
    case '.tsx':
    case '.jsx':
      return 'text/jsx';
    case '.html':
    case '.htm':
      return 'text/html';
    case '.css':
      return 'text/css';
    case '.scss':
    case '.sass':
      return 'text/x-scss';
    case '.less':
      return 'text/x-less';
    case '.txt':
      return 'text/plain';
    case '.csv':
      return 'text/csv';
    case '.xml':
      return 'application/xml';
    case '.yml':
    case '.yaml':
      return 'application/yaml';
    case '.toml':
      return 'text/x-toml';
    case '.ini':
    case '.cfg':
    case '.conf':
      return 'text/x-ini';
    case '.log':
      return 'text/plain';
    case '.dockerfile':
      return 'text/x-dockerfile';
    case '.gitignore':
    case '.gitattributes':
    case '.gitmodules':
      return 'text/plain';
    case '.env':
    case '.env.example':
    case '.env.local':
      return 'text/plain';
      
    default:
      return 'application/octet-stream'; // Default binary mime type
  }
}

// Check if a file is an image
export function isImage(filePath: string): boolean {
  const mimeType = getMimeType(filePath);
  return mimeType.startsWith('image/');
}

// Check if a file is a PDF
export function isPdf(filePath: string): boolean {
  return getMimeType(filePath) === 'application/pdf';
}

// Check if a file is a video
export function isVideo(filePath: string): boolean {
  const mimeType = getMimeType(filePath);
  return mimeType.startsWith('video/');
}

// Check if a file is an audio file
export function isAudio(filePath: string): boolean {
  const mimeType = getMimeType(filePath);
  return mimeType.startsWith('audio/');
}

// Check if a file is a text/code file
export function isTextOrCode(filePath: string): boolean {
  const mimeType = getMimeType(filePath);
  const ext = path.extname(filePath).toLowerCase();
  
  // Check if this is a known text/code mime type
  if (
    mimeType.startsWith('text/') || 
    mimeType === 'application/json' || 
    mimeType === 'application/javascript' || 
    mimeType === 'application/typescript' || 
    mimeType === 'application/x-tex' ||
    mimeType === 'application/x-bibtex' ||
    mimeType === 'application/yaml' ||
    mimeType === 'application/xml'
  ) {
    return true;
  }
  
  // For unrecognized extensions, try to open files without extensions or with 
  // extensions that don't have binary content
  if (ext === '' || isLikelyTextFile(ext)) {
    return true;
  }
  
  // Default to false for unknown types
  return false;
}

// Helper function to check if a file extension likely represents a text file
function isLikelyTextFile(ext: string): boolean {
  // List of common binary file extensions that should NOT be opened in the editor
  const binaryExtensions = [
    // Compressed files
    '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz',
    // Executables and binaries
    '.exe', '.dll', '.so', '.dylib', '.bin', '.dat',
    // Media files not already handled by specialized viewers
    '.psd', '.ai', '.eps', '.indd',
    // Database files
    '.db', '.sqlite', '.mdb', '.accdb',
    // Other binary formats
    '.iso', '.bin', '.class', '.o', '.a'
  ];
  
  return !binaryExtensions.includes(ext);
}

// Get the appropriate editor language mode for a file
export function getEditorLanguage(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  
  switch (ext) {
    // Web development
    case '.js':
    case '.mjs':
      return 'javascript';
    case '.ts':
      return 'typescript';
    case '.jsx':
      return 'javascript';
    case '.tsx':
      return 'typescript';
    case '.json':
      return 'json';
    case '.html':
    case '.htm':
      return 'html';
    case '.css':
      return 'css';
    case '.scss':
    case '.sass':
      return 'scss';
    case '.less':
      return 'less';
    case '.md':
      return 'markdown';
    
    // Programming languages
    case '.py':
    case '.pyw':
    case '.pyx':
    case '.pyi':
      return 'python';
    case '.java':
      return 'java';
    case '.c':
      return 'c';
    case '.cpp':
    case '.cc':
    case '.cxx':
      return 'cpp';
    case '.h':
    case '.hpp':
      return 'cpp';
    case '.cs':
      return 'csharp';
    case '.go':
      return 'go';
    case '.rs':
      return 'rust';
    case '.rb':
      return 'ruby';
    case '.php':
      return 'php';
    case '.pl':
    case '.pm':
      return 'perl';
    case '.swift':
      return 'swift';
    case '.scala':
      return 'scala';
    case '.kt':
    case '.kts':
      return 'kotlin';
    case '.dart':
      return 'dart';
    case '.lua':
      return 'lua';
    case '.sh':
    case '.bash':
      return 'shell';
    case '.ps1':
    case '.psm1':
      return 'powershell';
    case '.r':
      return 'r';
    case '.sql':
      return 'sql';
    
    // Configuration files
    case '.xml':
      return 'xml';
    case '.yml':
    case '.yaml':
      return 'yaml';
    case '.toml':
      return 'toml';
    case '.ini':
    case '.cfg':
    case '.conf':
      return 'ini';
    
    // Document formats
    case '.tex':
      return 'latex';
    case '.bib':
      return 'bibtex';
    
    // Default for all other files
    default:
      return 'plaintext';
  }
} 