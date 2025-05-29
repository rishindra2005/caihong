import { DocumentIcon } from '@heroicons/react/24/outline';

type IconMap = { [key: string]: string };

// Icon categories
const ICONS: { [key: string]: IconMap } = {
  // Programming Languages
  languages: {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    cc: 'cpp',
    c: 'c',
    go: 'go',
    rs: 'rust',
    php: 'php',
    rb: 'ruby',
  },

  // Web Technologies
  web: {
    html: 'html',
    css: 'css',
    scss: 'sass',
    sass: 'sass',
    vue: 'vue',
    svelte: 'svelte',
  },

  // Data Formats
  data: {
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    xml: 'xml',
    csv: 'table',
  },

  // Documents
  documents: {
    md: 'markdown',
    markdown: 'markdown',
    pdf: 'pdf',
    txt: 'text',
    doc: 'word',
    docx: 'word',
  },

  // LaTeX
  latex: {
    tex: 'tex',
    bibtex: 'bibtex-style',
    bib: 'bibtex-style',
    bbl: 'bibtex-style',
    cls: 'tex',
    sty: 'tex',
    ltx: 'tex',
    log: 'log',
    out: 'log',
    synctex: 'log',
    nav: 'log',
    toc: 'log',
    lof: 'log',
    lot: 'log',
    aux: 'log',

  },

  // Media
  media: {
    jpg: 'image',
    jpeg: 'image',
    png: 'image',
    gif: 'image',
    bmp: 'image',
    webp: 'image',
    mp4: 'video',
    mov: 'video',
    avi: 'video',
    mkv: 'video',
    webm: 'video',
    mp3: 'audio',
    wav: 'audio',
    ogg: 'audio',
    flac: 'audio',
    svg: 'svg',
  },

  // Archives
  archives: {
    zip: 'zip',
    rar: 'zip',
    '7z': 'zip',
    tar: 'zip',
    gz: 'zip',
  },
};

// Special filenames that should use specific icons
const SPECIAL_FILES: IconMap = {
  'package.json': 'npm',
  'package-lock.json': 'npm',
  'yarn.lock': 'yarn',
  'pnpm-lock.yaml': 'pnpm',
  'tsconfig.json': 'tsconfig',
  '.env': 'env',
  '.env.local': 'env',
  '.env.development': 'env',
  '.env.production': 'env',
  'docker-compose.yml': 'docker',
  'docker-compose.yaml': 'docker',
  'Dockerfile': 'docker',
  '.gitignore': 'git',
  '.dockerignore': 'docker',
  'README.md': 'readme',
  'LICENSE': 'license',
};

export function getFileIconPath(filename: string): string {
  // Check for exact filename matches first
  if (filename in SPECIAL_FILES) {
    return `/mine_icons/${SPECIAL_FILES[filename]}.svg`;
  }

  // Get file extension
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  // Check all icon categories
  for (const category of Object.values(ICONS)) {
    if (ext in category) {
      return `/mine_icons/${category[ext]}.svg`;
    }
  }

  // Return default icon if no match found
  return '/mine_icons/default.svg';
}

export function FileIcon({ filename, className = 'w-5 h-5' }: { filename: string; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <img
        src={getFileIconPath(filename)}
        alt={filename}
        className="w-full h-full object-contain"
        onError={(e) => {
          // Fallback to default document icon if image fails to load
          e.currentTarget.style.display = 'none';
          const fallbackIcon = document.createElement('div');
          fallbackIcon.innerHTML = `<svg class="${className} text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>`;
          e.currentTarget.parentElement?.appendChild(fallbackIcon.firstChild as Node);
        }}
      />
    </div>
  );
} 