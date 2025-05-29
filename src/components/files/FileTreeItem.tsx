import { 
  FolderIcon, 
  ChevronDownIcon, 
  ChevronRightIcon,
  ArrowPathIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { FileIcon } from './FileIcons';

interface FileSystemItem {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileSystemItem[];
}

interface FileTreeItemProps {
  item: FileSystemItem;
  level: number;
  selectedFile: string | null;
  selectedItems: Set<string>;
  expandedFolders: Set<string>;
  loading: { type: string; path: string } | null;
  isRenaming: { path: string; name: string } | null;
  isCreatingNew: { type: 'file' | 'directory'; path: string } | null;
  newItemName: string;
  onSelect: (item: FileSystemItem) => void;
  onToggleExpand: (path: string) => void;
  onRename: (oldPath: string, newName: string) => void;
  onContextMenu: (e: React.MouseEvent, type: 'file' | 'directory', path: string) => void;
  onCreateItem: (type: 'file' | 'directory', parentPath: string, name: string) => void;
  onClick: (e: React.MouseEvent, item: FileSystemItem) => void;
  setIsRenaming: (value: { path: string; name: string } | null) => void;
  setIsCreatingNew: (value: { type: 'file' | 'directory'; path: string } | null) => void;
  setNewItemName: (value: string) => void;
  lastTextFile?: string | null;
}

// File extension to icon mapping
const getFileIcon = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  // Common programming languages
  if (ext === 'ts' || ext === 'tsx') return '/mine_icons/typescript.svg';
  if (ext === 'js' || ext === 'jsx') return '/mine_icons/javascript.svg';
  if (ext === 'py') return '/mine_icons/python.svg';
  if (ext === 'java') return '/mine_icons/java.svg';
  if (ext === 'cpp' || ext === 'cc') return '/mine_icons/cpp.svg';
  if (ext === 'c') return '/mine_icons/c.svg';
  if (ext === 'go') return '/mine_icons/go.svg';
  if (ext === 'rs') return '/mine_icons/rust.svg';
  if (ext === 'php') return '/mine_icons/php.svg';
  if (ext === 'rb') return '/mine_icons/ruby.svg';
  
  // Web technologies
  if (ext === 'html') return '/mine_icons/html.svg';
  if (ext === 'css') return '/mine_icons/css.svg';
  if (ext === 'scss' || ext === 'sass') return '/mine_icons/sass.svg';
  if (ext === 'vue') return '/mine_icons/vue.svg';
  if (ext === 'svelte') return '/mine_icons/svelte.svg';
  
  // Data formats
  if (ext === 'json') return '/mine_icons/json.svg';
  if (ext === 'yaml' || ext === 'yml') return '/mine_icons/yaml.svg';
  if (ext === 'xml') return '/mine_icons/xml.svg';
  if (ext === 'csv') return '/mine_icons/table.svg';
  
  // Documents
  if (ext === 'md' || ext === 'markdown') return '/mine_icons/markdown.svg';
  if (ext === 'pdf') return '/mine_icons/pdf.svg';
  if (ext === 'txt') return '/mine_icons/text.svg';
  if (ext === 'doc' || ext === 'docx') return '/mine_icons/word.svg';
  if (ext === 'tex') return '/mine_icons/tex.svg';
  
  // Media
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) return '/mine_icons/image.svg';
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return '/mine_icons/video.svg';
  if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) return '/mine_icons/audio.svg';
  if (ext === 'svg') return '/mine_icons/svg.svg';
  
  // Config files
  if (filename === 'package.json') return '/mine_icons/npm.svg';
  if (filename === 'tsconfig.json') return '/mine_icons/tsconfig.svg';
  if (filename.startsWith('.env')) return '/mine_icons/env.svg';
  if (filename === 'docker-compose.yml' || filename === 'docker-compose.yaml') return '/mine_icons/docker.svg';
  if (filename === 'Dockerfile') return '/mine_icons/docker.svg';
  
  // Archives
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return '/mine_icons/zip.svg';
  
  // Default
  return '/mine_icons/default.svg';
};

export default function FileTreeItem({
  item,
  level,
  selectedFile,
  selectedItems,
  expandedFolders,
  loading,
  isRenaming,
  isCreatingNew,
  newItemName,
  onSelect,
  onToggleExpand,
  onRename,
  onContextMenu,
  onCreateItem,
  onClick,
  setIsRenaming,
  setIsCreatingNew,
  setNewItemName,
  lastTextFile,
}: FileTreeItemProps) {
  const newItemInputRef = useRef<HTMLInputElement>(null);

  // Add an effect to focus input when it appears
  useEffect(() => {
    if ((isCreatingNew && isCreatingNew.path === item.path) || 
        (isRenaming && isRenaming.path === item.path)) {
      setTimeout(() => {
        if (newItemInputRef.current) {
          newItemInputRef.current.focus();
        }
      }, 50);
    }
  }, [isCreatingNew, isRenaming, item.path]);

  // Add a new effect to maintain focus when typing
  useEffect(() => {
    // If we're actively creating a new item or renaming this item, ensure focus stays on input
    if ((isCreatingNew && isCreatingNew.path === item.path) || 
        (isRenaming && isRenaming.path === item.path)) {
      if (newItemInputRef.current) {
        newItemInputRef.current.focus();
      }
    }
  }, [newItemName, isRenaming?.name, isCreatingNew, isRenaming, item.path]);

  const renderChildren = () => {
    if (item.type !== 'directory' || !expandedFolders.has(item.path)) return null;

    // If there are no children after filtering, show a message
    if (item.children?.length === 0) {
      return (
        <div 
          className="text-xs text-gray-500 italic pl-2 py-1" 
          style={{ marginLeft: `${(level + 1) * 20}px` }}
        >
          No visible items
        </div>
      );
    }

    return (
      <>
        {item.children?.map((child) => (
          <FileTreeItem
            key={child.path}
            item={child}
            level={level + 1}
            selectedFile={selectedFile}
            selectedItems={selectedItems}
            expandedFolders={expandedFolders}
            loading={loading}
            isRenaming={isRenaming}
            isCreatingNew={isCreatingNew}
            newItemName={newItemName}
            onSelect={onSelect}
            onToggleExpand={onToggleExpand}
            onRename={onRename}
            onContextMenu={onContextMenu}
            onCreateItem={onCreateItem}
            onClick={onClick}
            setIsRenaming={setIsRenaming}
            setIsCreatingNew={setIsCreatingNew}
            setNewItemName={setNewItemName}
            lastTextFile={lastTextFile}
          />
        ))}
        {isCreatingNew && isCreatingNew.path === item.path && (
          <div className="flex items-center" style={{ marginLeft: `${(level + 1) * 20}px` }}>
            <input
              ref={newItemInputRef}
              type="text"
              value={newItemName}
              onChange={(e) => {
                setNewItemName(e.target.value);
                // Ensure focus remains on the input after state change
                requestAnimationFrame(() => {
                  if (newItemInputRef.current) {
                    newItemInputRef.current.focus();
                  }
                });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newItemName.trim()) {
                  onCreateItem(isCreatingNew.type, item.path, newItemName);
                  setIsCreatingNew(null);
                  setNewItemName('');
                } else if (e.key === 'Escape') {
                  setIsCreatingNew(null);
                  setNewItemName('');
                }
              }}
              placeholder={`New ${isCreatingNew.type}...`}
              className="w-full px-2 py-1 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              autoFocus
            />
            <button
              onClick={() => {
                if (newItemName.trim()) {
                  onCreateItem(isCreatingNew.type, item.path, newItemName);
                }
                setIsCreatingNew(null);
                setNewItemName('');
              }}
              className="ml-2 px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Create
            </button>
            <button
              onClick={() => {
                setIsCreatingNew(null);
                setNewItemName('');
              }}
              className="ml-1 px-2 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        )}
      </>
    );
  };

  if (isRenaming && isRenaming.path === item.path) {
    return (
      <div className="flex items-center" style={{ marginLeft: `${level * 20}px` }}>
        <input
          ref={newItemInputRef}
          type="text"
          value={isRenaming.name}
          onChange={(e) => {
            setIsRenaming({ ...isRenaming, name: e.target.value });
            // Ensure focus remains on the input after state change
            requestAnimationFrame(() => {
              if (newItemInputRef.current) {
                newItemInputRef.current.focus();
              }
            });
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (isRenaming.name.trim() && isRenaming.name !== item.name) {
                onRename(item.path, isRenaming.name);
              }
              setIsRenaming(null);
            } else if (e.key === 'Escape') {
              setIsRenaming(null);
            }
          }}
          className="w-full px-2 py-1 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          autoFocus
        />
        <button
          onClick={() => {
            if (isRenaming.name.trim() && isRenaming.name !== item.name) {
              onRename(item.path, isRenaming.name);
            }
            setIsRenaming(null);
          }}
          className="ml-2 px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Rename
        </button>
        <button
          onClick={() => setIsRenaming(null)}
          className="ml-1 px-2 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>
    );
  }

  // Determine if this item is selected (either as the active file or in multiselect)
  const isSelected = selectedItems.has(item.path);
  const isOpened = selectedFile === item.path;
  const isEditedInEditor = lastTextFile === item.path;
  // Check if the file is inside the current folder path
  const isInCurrentPath = item.type === 'directory' && (selectedFile?.startsWith(item.path + '/') || false);

  return (
    <>
      <div
        className={`flex items-center space-x-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded cursor-pointer ${
          isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
        } ${isOpened ? 'bg-blue-100 dark:bg-blue-900/40 border-l-2 border-blue-500' : ''}
        ${isEditedInEditor ? 'bg-orange-100 dark:bg-orange-900/30 border-l-2 border-orange-500' : ''}
        ${isInCurrentPath ? 'bg-green-50 dark:bg-green-900/20 border-l-2 border-green-500' : ''}
        ${loading?.path === item.path ? 'opacity-50' : ''}`}
        style={{ marginLeft: `${level * 20}px` }}
        onClick={(e) => {
          e.stopPropagation();
          onClick(e, item);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onContextMenu(e, item.type, item.path);
        }}
      >
        {loading?.path === item.path && (
          <ArrowPathIcon className="w-4 h-4 animate-spin absolute left-0" />
        )}
        <div className="flex items-center space-x-2 min-w-0 flex-grow">
          {item.type === 'directory' ? (
            <>
              {expandedFolders.has(item.path) ? (
                <ChevronDownIcon className="w-4 h-4 flex-shrink-0" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 flex-shrink-0" />
              )}
              <FolderIcon className={`w-5 h-5 flex-shrink-0 ${isInCurrentPath ? 'text-green-500' : 'text-yellow-500'}`} />
            </>
          ) : (
            <>
              <span className="w-4 flex-shrink-0" />
              <FileIcon filename={item.name} className={`w-5 h-5 flex-shrink-0 ${isOpened ? 'opacity-100' : 'opacity-75'}`} />
            </>
          )}
          <span className={`text-sm truncate ${isOpened ? 'font-medium' : ''}`}>{item.name}</span>
        </div>
        {isSelected && (
          <CheckIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
        )}
      </div>
      {renderChildren()}
    </>
  );
} 