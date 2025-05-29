import { ChevronRightIcon, HomeIcon, FolderIcon } from '@heroicons/react/24/outline';

interface PathBreadcrumbProps {
  path: string;
  onNavigate: (path: string) => void;
  selectedFile?: string | null;
}

export default function PathBreadcrumb({ path, onNavigate, selectedFile }: PathBreadcrumbProps) {
  // Extract directory from selectedFile if needed
  const openedFilePath = selectedFile || '';
  const openedFileDir = openedFilePath ? openedFilePath.substring(0, openedFilePath.lastIndexOf('/')) : '';
  
  // Determine if we should show the current path or the path to the opened file
  const displayPath = path || openedFileDir;
  
  // Split path into segments
  const segments = displayPath ? displayPath.split('/').filter(Boolean) : [];
  
  // Build breadcrumb segments with their full paths
  const pathSegments = segments.map((segment, index) => {
    const fullPath = segments.slice(0, index + 1).join('/');
    return { name: segment, path: fullPath };
  });

  return (
    <div className="w-full relative">
      <div className="py-1 px-2 bg-gray-50 dark:bg-gray-800 rounded text-xs no-scrollbar overflow-x-hidden hover:overflow-x-scroll transition-all duration-300" style={{ scrollbarWidth: 'thin' }}>
        <div className="flex items-center whitespace-nowrap">
          <button 
            onClick={() => onNavigate('')}
            className="flex items-center px-1.5 py-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Navigate to root directory"
          >
            <HomeIcon className="w-3 h-3 mr-0.5" />
            <span className="font-medium">Root</span>
          </button>
          
          {pathSegments.map((segment, index) => (
            <span key={segment.path} className="flex items-center">
              <ChevronRightIcon className="w-3 h-3 mx-0.5 text-gray-400" />
              <button
                className={`flex items-center px-1.5 py-0.5 rounded transition-colors
                  ${index === pathSegments.length - 1 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium' 
                    : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                onClick={() => onNavigate(segment.path)}
                title={`Navigate to ${segment.path}`}
              >
                <FolderIcon className="w-3 h-3 mr-0.5 text-yellow-500" />
                <span className="max-w-[100px] truncate">{segment.name}</span>
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
} 