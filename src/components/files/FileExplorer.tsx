'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import path from 'path';
import { 
  DocumentPlusIcon,
  FolderPlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ScissorsIcon,
  ClipboardIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  FolderArrowDownIcon,
  ArrowDownTrayIcon,
  ChevronRightIcon,
  FolderMinusIcon
} from '@heroicons/react/24/outline';
import FileTreeItem from './FileTreeItem';
import ContextMenu from './ContextMenu';
import ProgressIndicator, { ProgressOperation } from '../progress/ProgressIndicator';
import PathBreadcrumb from './PathBreadcrumb'; 
import KeyboardShortcutHelp from './KeyboardShortcutHelp';
import ImagePasteDialog from './ImagePasteDialog';

interface FileSystemItem {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileSystemItem[];
}

interface FileExplorerProps {
  projectId: string;
  fileSystem: FileSystemItem[];
  selectedFile: string | null;
  loading: { type: string; path: string } | null;
  clipboard: { type: 'cut' | 'copy'; paths: string[] } | null;
  projectSize: number;
  storageLimit: number;
  onFileSelect: (item: FileSystemItem) => void;
  onCreateItem: (type: 'file' | 'directory', parentPath: string, name: string) => void;
  onRenameItem: (oldPath: string, newName: string) => void;
  onDeleteItem: (paths: string[]) => void;
  onCopy: (paths: string[], type: 'cut' | 'copy') => void;
  onPaste: (targetPath: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  hideDotFiles?: boolean;
  hideFileExtensions?: string[];
  lastTextFile?: string | null;
}

export default function FileExplorer({
  projectId,
  fileSystem,
  selectedFile,
  loading,
  clipboard,
  projectSize,
  storageLimit,
  onFileSelect,
  onCreateItem,
  onRenameItem,
  onDeleteItem,
  onCopy,
  onPaste,
  onRefresh,
  isRefreshing,
  hideDotFiles = false,
  hideFileExtensions = [],
  lastTextFile,
}: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: 'file' | 'directory' | 'empty'; path: string } | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<{ type: 'file' | 'directory'; path: string } | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [isRenaming, setIsRenaming] = useState<{ path: string; name: string } | null>(null);
  const [operations, setOperations] = useState<ProgressOperation[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [currentDirectory, setCurrentDirectory] = useState<string>('');
  const [showShortcutHelp, setShowShortcutHelp] = useState<boolean>(false);
  const [lastClickedItem, setLastClickedItem] = useState<{ path: string; time: number } | null>(null);
  const [pastedImage, setPastedImage] = useState<{data: string, suggestedName: string} | null>(null);
  
  const explorerRef = useRef<HTMLDivElement>(null);
  const newItemInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleContextMenu = (e: React.MouseEvent, type: 'file' | 'directory' | 'empty', path: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.pageX,
      y: e.pageY,
      type,
      path,
    });
  };

  const handleToggleExpand = (dirPath: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(dirPath)) {
      newExpanded.delete(dirPath);
    } else {
      newExpanded.add(dirPath);
      // Update current directory when expanding a folder
      setCurrentDirectory(dirPath);
    }
    setExpandedFolders(newExpanded);
  };

  const handleItemClick = (e: React.MouseEvent, item: FileSystemItem) => {
    const now = Date.now();
    const isCtrlPressed = e.ctrlKey || e.metaKey;
    const isShiftPressed = e.shiftKey;
    
    // Handle double click (open file or folder)
    if (lastClickedItem && lastClickedItem.path === item.path && now - lastClickedItem.time < 300) {
      if (item.type === 'directory') {
        handleToggleExpand(item.path);
        setCurrentDirectory(item.path); // Set current directory when opening a folder
      } else {
        onFileSelect(item);
        // When opening a file, set current directory to its containing folder
        const fileDir = item.path.substring(0, item.path.lastIndexOf('/'));
        setCurrentDirectory(fileDir || '');
      }
      return;
    }
    
    // Handle single click (selection)
    setLastClickedItem({ path: item.path, time: now });
    
    if (isCtrlPressed) {
      // Control click = toggle selection
      const newSelectedItems = new Set(selectedItems);
      if (newSelectedItems.has(item.path)) {
        newSelectedItems.delete(item.path);
      } else {
        newSelectedItems.add(item.path);
      }
      setSelectedItems(newSelectedItems);
    } else if (isShiftPressed && selectedItems.size > 0) {
      // Shift click = select range
      // This is a simplified implementation - for a full one, you'd need to track
      // the last selected item and select all items between that and current
      const newSelectedItems = new Set(selectedItems);
      newSelectedItems.add(item.path);
      setSelectedItems(newSelectedItems);
    } else {
      // Normal click = select only this item
      setSelectedItems(new Set([item.path]));
    }
  };

  const handleDownload = async (path: string) => {
    // Create a unique ID for this operation
    const operationId = `download-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const fileName = path.split('/').pop() || 'file';
    
    // Add the download operation
    setOperations(prev => [...prev, {
      id: operationId,
      type: 'download',
      name: fileName,
      progress: 0,
      status: 'pending',
      createdAt: new Date()
    }]);
    
    try {
      // Start with some progress to show activity
      setOperations(prev => 
        prev.map(op => 
          op.id === operationId 
            ? { ...op, progress: 10, status: 'active' } 
            : op
        )
      );
      
      const response = await fetch(`/api/projects/${projectId}/files/download?path=${encodeURIComponent(path)}`);
      
      if (!response.ok) {
        throw new Error('Failed to download');
      }

      // Update progress to 50% after response is received
      setOperations(prev => 
        prev.map(op => 
          op.id === operationId 
            ? { ...op, progress: 50 } 
            : op
        )
      );

      // Get the filename from the Content-Disposition header or fallback to path basename
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : path.split('/').pop() || 'download';

      // Get file size if available
      const contentLength = response.headers.get('Content-Length');
      if (contentLength) {
        setOperations(prev => 
          prev.map(op => 
            op.id === operationId 
              ? { ...op, size: parseInt(contentLength) } 
              : op
          )
        );
      }

      // Create a blob from the response
      const blob = await response.blob();
      
      // Update progress to 80% after blob is created
      setOperations(prev => 
        prev.map(op => 
          op.id === operationId 
            ? { ...op, progress: 80 } 
            : op
        )
      );
      
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link and click it to start the download
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Mark as completed
      setOperations(prev => 
        prev.map(op => 
          op.id === operationId 
            ? { ...op, progress: 100, status: 'completed' } 
            : op
        )
      );
    } catch (error) {
      console.error('Download error:', error);
      
      // Mark as error
      setOperations(prev => 
        prev.map(op => 
          op.id === operationId 
            ? { 
                ...op, 
                status: 'error', 
                message: 'Failed to download. Please try again.' 
              } 
            : op
        )
      );
      
      alert('Failed to download. Please try again.');
    }
  };

  const handleBulkDownload = async (paths: string[]) => {
    // For multiple items, we need a zip download endpoint or download them one by one
    if (paths.length === 1) {
      handleDownload(paths[0]);
    } else {
      // This would ideally call a bulk download API endpoint
      // For now just alert about multiple downloads
      alert(`Downloading ${paths.length} items is not yet implemented`);
    }
  };

  const handleBulkDelete = async (paths: string[]) => {
    if (confirm(`Are you sure you want to delete ${paths.length} item(s)?`)) {
      // Call onDeleteItem with the array of paths
      onDeleteItem(paths);
      setSelectedItems(new Set());
    }
  };

  const handleBulkCopy = (paths: string[], operation: 'cut' | 'copy') => {
    // Pass all selected paths to the onCopy function
    onCopy(paths, operation);
  };

  // Helper function to get all visible items in the current view
  const getAllVisibleItems = (): FileSystemItem[] => {
    const result: FileSystemItem[] = [];
    
    // Recursive function to collect visible items
    const collectItems = (items: FileSystemItem[], parentVisible: boolean) => {
      for (const item of items) {
        if (parentVisible) {
          result.push(item);
        }
        
        if (item.type === 'directory' && item.children && expandedFolders.has(item.path)) {
          collectItems(item.children, parentVisible);
        }
      }
    };
    
    collectItems(fileSystem, true); // Start with root items being visible
    return result;
  };

  const handleKeyboardShortcut = useCallback((e: KeyboardEvent) => {
    // Ignore if focus is in an input field
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    // Get array from selected items Set
    const selectedPaths = Array.from(selectedItems);
    
    // Only handle shortcuts if we have items selected or for universal commands
    if (selectedPaths.length > 0 || ['n', 'f', 'h', 'v', 'c'].includes(e.key.toLowerCase())) {
      if (e.key === 'Delete') {
        e.preventDefault();
        handleBulkDelete(selectedPaths);
      } else if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'c' && !e.altKey) {
          e.preventDefault();
          handleBulkCopy(selectedPaths, 'copy');
        } else if (e.key.toLowerCase() === 'c' && e.altKey) {
          e.preventDefault();
          handleCollapseAllFolders();
        } else if (e.key.toLowerCase() === 'x') {
          e.preventDefault();
          handleBulkCopy(selectedPaths, 'cut');
        } else if (e.key.toLowerCase() === 'v' && clipboard) {
          e.preventDefault();
          onPaste(currentDirectory);
        } else if (e.key.toLowerCase() === 'a') {
          e.preventDefault();
          // Select all items in the current view
          const allItems = getAllVisibleItems();
          setSelectedItems(new Set(allItems.map(item => item.path)));
        } else if (e.key.toLowerCase() === 'n') {
          e.preventDefault();
          setIsCreatingNew({ type: e.shiftKey ? 'directory' : 'file', path: currentDirectory });
          setNewItemName('');
          // Focus the input after it appears
          setTimeout(() => {
            if (newItemInputRef.current) {
              newItemInputRef.current.focus();
            }
          }, 50);
        } else if (e.key.toLowerCase() === 'h') {
          e.preventDefault();
          setShowShortcutHelp(!showShortcutHelp);
        }
      } else if (e.key === 'F2' && selectedPaths.length === 1) {
        e.preventDefault();
        const name = selectedPaths[0].split('/').pop() || '';
        setIsRenaming({ path: selectedPaths[0], name });
        // Focus the rename input after it appears
        setTimeout(() => {
          const inputs = document.querySelectorAll('input');
          for (const input of inputs) {
            if (input.value === name) {
              input.focus();
              break;
            }
          }
        }, 50);
      }
    }
  }, [selectedItems, clipboard, currentDirectory, handleBulkDelete, handleBulkCopy, onPaste, setShowShortcutHelp, fileSystem, expandedFolders]);

  // Add new handler for clipboard paste events
  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    // Check if we have items in clipboard
    if (!e.clipboardData || !e.clipboardData.items) return;
    
    // Look for image items
    for (let i = 0; i < e.clipboardData.items.length; i++) {
      const item = e.clipboardData.items[i];
      
      // Check if item is an image
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault(); // Prevent default paste behavior
        
        // Get the image as a blob
        const blob = item.getAsFile();
        if (!blob) continue;
        
        // Read the image file to data URL
        const reader = new FileReader();
        reader.onload = (event) => {
          if (!event.target || typeof event.target.result !== 'string') return;
          
          // Determine a suggested file name based on mime type
          const mimeType = blob.type;
          const extension = mimeType.split('/')[1] || 'png';
          const timestamp = new Date().toISOString().replace(/[-:.]/g, '').substring(0, 14);
          const suggestedName = `pasted_image_${timestamp}.${extension}`;
          
          // Set the pasted image data
          setPastedImage({
            data: event.target.result,
            suggestedName
          });
        };
        reader.readAsDataURL(blob);
        break; // We only handle the first image
      }
    }
  }, []);

  // Add handler for saving pasted image
  const handleSavePastedImage = async (fileName: string) => {
    if (!pastedImage) return;
    
    // Declare operationId outside the try block so it's accessible in the catch block
    let operationId: string;
    
    try {
      // Create a unique ID for this operation
      operationId = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Add operation to tracking
      setOperations(prev => [...prev, {
        id: operationId,
        type: 'upload',
        name: fileName,
        progress: 10,
        status: 'active',
        createdAt: new Date()
      }]);
      
      // Send the image data to backend
      const response = await fetch(`/api/projects/${projectId}/files/paste-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: pastedImage.data,
          fileName: fileName,
          directoryPath: currentDirectory,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save image');
      }
      
      // Update operation status
      setOperations(prev => 
        prev.map(op => 
          op.id === operationId 
            ? { ...op, progress: 100, status: 'completed' } 
            : op
        )
      );
      
      // Refresh the file list
      onRefresh();
      
      // Clear the pasted image
      setPastedImage(null);
    } catch (error) {
      console.error('Error saving pasted image:', error);
      setOperations(prev => 
        prev.map(op => 
          op.id === operationId 
            ? { 
                ...op, 
                status: 'error', 
                message: error instanceof Error ? error.message : 'Failed to save image' 
              } 
            : op
        )
      );
    }
  };

  // Add clipboard event listeners
  useEffect(() => {
    // Focus the explorer to capture keyboard events
    if (explorerRef.current) {
      explorerRef.current.focus();
    }

    // Add paste event listener
    window.addEventListener('paste', handlePaste);
    
    // Add keyboard shortcut event listeners
    window.addEventListener('keydown', handleKeyboardShortcut);
    
    return () => {
      window.removeEventListener('paste', handlePaste);
      window.removeEventListener('keydown', handleKeyboardShortcut);
    };
  }, [handlePaste, handleKeyboardShortcut]);

  // Reset selected items when file system changes
  useEffect(() => {
    setSelectedItems(new Set());
  }, [fileSystem]);

  // Add a useEffect to update current directory when selectedFile changes
  useEffect(() => {
    if (selectedFile) {
      // Extract directory from selected file path
      const fileDir = selectedFile.substring(0, selectedFile.lastIndexOf('/'));
      
      // Optionally update current directory to match file location
      // Only update if current directory is empty or unrelated to selected file path
      if (!currentDirectory || !selectedFile.startsWith(currentDirectory)) {
        setCurrentDirectory(fileDir || '');
        
        // Expand folders in the path to make the file visible
        const segments = fileDir.split('/').filter(Boolean);
        const expandedPaths = new Set(expandedFolders);
        
        // Build paths for each segment and add to expanded folders
        let currentPath = '';
        for (const segment of segments) {
          currentPath = currentPath ? `${currentPath}/${segment}` : segment;
          expandedPaths.add(currentPath);
        }
        
        setExpandedFolders(expandedPaths);
      }
    }
  }, [selectedFile]);

  // Add a new effect to maintain focus when typing in the create new field
  useEffect(() => {
    // If we're actively creating a new item at the root level, ensure focus stays on input
    if (isCreatingNew && isCreatingNew.path === '' && newItemInputRef.current) {
      newItemInputRef.current.focus();
    }
  }, [isCreatingNew, newItemName]);

  // Filter function for file system items
  const filterFileSystemItems = useCallback((items: FileSystemItem[]): FileSystemItem[] => {
    return items.filter(item => {
      // Check for dot files/folders
      if (hideDotFiles && item.name.startsWith('.')) {
        return false;
      }

      // Check for file extensions
      if (item.type === 'file' && hideFileExtensions.length > 0) {
        const extension = item.name.split('.').pop()?.toLowerCase();
        if (extension && hideFileExtensions.includes(extension)) {
          return false;
        }
      }

      // If it's a directory, filter its children recursively
      if (item.type === 'directory' && item.children) {
        item.children = filterFileSystemItems(item.children);
      }

      return true;
    });
  }, [hideDotFiles, hideFileExtensions]);

  // Apply filters to file system
  const filteredFileSystem = useMemo(() => {
    return filterFileSystemItems([...fileSystem]);
  }, [fileSystem, filterFileSystemItems]);

  const getContextMenuOptions = () => {
    if (!contextMenu) return [];

    const isMultiSelectionContext = selectedItems.size > 1 && selectedItems.has(contextMenu.path);
    
    if (contextMenu.type === 'empty') {
      return [
        {
          label: 'New File',
          icon: <DocumentPlusIcon className="w-5 h-5" />,
          onClick: () => {
            setContextMenu(null);
            // Use small timeout to ensure context menu is closed before input appears
            setTimeout(() => {
              const targetPath = contextMenu.path || currentDirectory;
              setIsCreatingNew({ type: 'file', path: targetPath });
              setNewItemName('');
              // Focus the input after it appears
              setTimeout(() => {
                if (newItemInputRef.current) {
                  newItemInputRef.current.focus();
                }
              }, 50);
            }, 10);
          },
        },
        {
          label: 'New Folder',
          icon: <FolderPlusIcon className="w-5 h-5" />,
          onClick: () => {
            setContextMenu(null);
            // Use small timeout to ensure context menu is closed before input appears
            setTimeout(() => {
              const targetPath = contextMenu.path || currentDirectory;
              setIsCreatingNew({ type: 'directory', path: targetPath });
              setNewItemName('');
              // Focus the input after it appears
              setTimeout(() => {
                if (newItemInputRef.current) {
                  newItemInputRef.current.focus();
                }
              }, 50);
            }, 10);
          },
        },
        ...(clipboard ? [{
          label: `Paste ${clipboard.paths.length} item(s)`,
          icon: <ClipboardIcon className="w-5 h-5" />,
          onClick: () => {
            onPaste(contextMenu.path);
            setContextMenu(null);
          },
        }] : []),
      ];
    }

    // For multi-selection context menu
    if (isMultiSelectionContext) {
      return [
        {
          label: `Download ${selectedItems.size} items`,
          icon: <ArrowDownTrayIcon className="w-5 h-5" />,
          onClick: () => {
            handleBulkDownload(Array.from(selectedItems));
            setContextMenu(null);
          },
        },
        {
          label: `Delete ${selectedItems.size} items`,
          icon: <TrashIcon className="w-5 h-5" />,
          onClick: () => {
            handleBulkDelete(Array.from(selectedItems));
            setContextMenu(null);
          },
        },
        {
          label: `Cut ${selectedItems.size} items`,
          icon: <ScissorsIcon className="w-5 h-5" />,
          onClick: () => {
            handleBulkCopy(Array.from(selectedItems), 'cut');
            setContextMenu(null);
          },
        },
        {
          label: `Copy ${selectedItems.size} items`,
          icon: <DocumentDuplicateIcon className="w-5 h-5" />,
          onClick: () => {
            handleBulkCopy(Array.from(selectedItems), 'copy');
            setContextMenu(null);
          },
        },
      ];
    }

    const options = [
      {
        label: 'Download',
        icon: <ArrowDownTrayIcon className="w-5 h-5" />,
        onClick: () => {
          handleDownload(contextMenu.path);
          setContextMenu(null);
        },
      },
      {
        label: 'Rename',
        icon: <PencilIcon className="w-5 h-5" />,
        onClick: () => {
          setContextMenu(null);
          // Use small timeout to ensure context menu is closed before starting rename
          setTimeout(() => {
            const name = contextMenu.path.split('/').pop() || '';
            setIsRenaming({ path: contextMenu.path, name });
          }, 10);
        },
      },
      {
        label: 'Cut',
        icon: <ScissorsIcon className="w-5 h-5" />,
        onClick: () => {
          onCopy([contextMenu.path], 'cut');
          setContextMenu(null);
        },
      },
      {
        label: 'Copy',
        icon: <DocumentDuplicateIcon className="w-5 h-5" />,
        onClick: () => {
          onCopy([contextMenu.path], 'copy');
          setContextMenu(null);
        },
      },
      {
        label: 'Delete',
        icon: <TrashIcon className="w-5 h-5" />,
        onClick: () => {
          onDeleteItem([contextMenu.path]);
          setContextMenu(null);
        },
      },
    ];

    // Add New File/Folder options for directories
    if (contextMenu.type === 'directory') {
      options.unshift(
        {
          label: 'New File',
          icon: <DocumentPlusIcon className="w-5 h-5" />,
          onClick: () => {
            setContextMenu(null);
            // Use small timeout to ensure context menu is closed before input appears
            setTimeout(() => {
              setIsCreatingNew({ type: 'file', path: contextMenu.path });
              setNewItemName('');
              // Focus the input after it appears
              setTimeout(() => {
                if (newItemInputRef.current) {
                  newItemInputRef.current.focus();
                }
              }, 50);
            }, 10);
          },
        },
        {
          label: 'New Folder',
          icon: <FolderPlusIcon className="w-5 h-5" />,
          onClick: () => {
            setContextMenu(null);
            // Use small timeout to ensure context menu is closed before input appears
            setTimeout(() => {
              setIsCreatingNew({ type: 'directory', path: contextMenu.path });
              setNewItemName('');
              // Focus the input after it appears
              setTimeout(() => {
                if (newItemInputRef.current) {
                  newItemInputRef.current.focus();
                }
              }, 50);
            }, 10);
          },
        }
      );
    }

    // Add Paste option if clipboard has content
    if (clipboard) {
      options.push({
        label: `Paste ${clipboard.paths.length} item(s)`,
        icon: <ClipboardIcon className="w-5 h-5" />,
        onClick: () => {
          onPaste(contextMenu.path);
          setContextMenu(null);
        },
      });
    }

    return options;
  };

  // Handle file upload with new operation tracking
  const handleFileUpload = async (files: FileList | null, basePath: string = '') => {
    if (!files || files.length === 0) return;

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        // Handle folder upload by preserving relative path
        const relativePath = file.webkitRelativePath || file.name;
        formData.append('path', path.join(basePath, relativePath));

        // Create a unique ID for this operation
        const operationId = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        
        // Add the operation to our list
        setOperations(prev => [...prev, {
          id: operationId,
          type: 'upload',
          name: relativePath,
          progress: 0,
          size: file.size,
          status: 'pending',
          createdAt: new Date()
        }]);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `/api/projects/${projectId}/files/upload`);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            // Update the progress of this specific operation
            setOperations(prev => 
              prev.map(op => 
                op.id === operationId 
                  ? { ...op, progress, status: 'active' } 
                  : op
              )
            );
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            // Mark operation as completed
            setOperations(prev => 
              prev.map(op => 
                op.id === operationId 
                  ? { ...op, progress: 100, status: 'completed' } 
                  : op
              )
            );
            onRefresh();
          } else {
            const response = JSON.parse(xhr.response);
            // Mark operation as error
            setOperations(prev => 
              prev.map(op => 
                op.id === operationId 
                  ? { 
                      ...op, 
                      status: 'error', 
                      message: response.error || 'Upload failed' 
                    } 
                  : op
              )
            );
            console.error('Upload failed:', response.error);
          }
        };

        xhr.onerror = () => {
          // Mark operation as error
          setOperations(prev => 
            prev.map(op => 
              op.id === operationId 
                ? { 
                    ...op, 
                    status: 'error', 
                    message: 'Network error occurred' 
                  } 
                : op
            )
          );
          console.error('Upload failed');
        };

        xhr.send(formData);
      } catch (error) {
        console.error('Upload error:', error);
      }
    }
  };

  // Function to remove an operation from the list
  const removeOperation = (id: string) => {
    setOperations(prev => prev.filter(op => op.id !== id));
  };

  const handleCollapseAllFolders = useCallback(() => {
    setExpandedFolders(new Set());
  }, []);

  return (
    <div 
      ref={explorerRef}
      className="w-full border-r border-gray-200 dark:border-gray-700 flex flex-col h-full"
      onContextMenu={(e) => {
        handleContextMenu(e, 'empty', '');
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('overflow-y-auto')) {
          setCurrentDirectory('');
        }
      }}
      tabIndex={0}
    >
      {/* Fixed Navigation Bar */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-3 py-2">
          <h2 className="text-sm font-semibold">Files</h2>
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCreatingNew({ type: 'file', path: currentDirectory });
                setNewItemName('');
                setTimeout(() => {
                  if (newItemInputRef.current) {
                    newItemInputRef.current.focus();
                  }
                }, 50);
              }}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              title="New File"
            >
              <DocumentPlusIcon className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCreatingNew({ type: 'directory', path: currentDirectory });
                setNewItemName('');
                setTimeout(() => {
                  if (newItemInputRef.current) {
                    newItemInputRef.current.focus();
                  }
                }, 50);
              }}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              title="New Folder"
            >
              <FolderPlusIcon className="w-4 h-4" />
            </button>
            <button
              onClick={onRefresh}
              className={`p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded ${
                isRefreshing ? 'animate-spin' : ''
              }`}
              title="Refresh"
              disabled={isRefreshing}
            >
              <ArrowPathIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              title="Upload File"
            >
              <ArrowUpTrayIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => folderInputRef.current?.click()}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              title="Upload Folder"
            >
              <FolderArrowDownIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowShortcutHelp(!showShortcutHelp)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              title="Keyboard Shortcuts"
            >
              <span className="text-xs font-mono">⌨️</span>
            </button>
          </div>
        </div>

        {/* Path Breadcrumb */}
        <div className="px-3 pb-2">
          <PathBreadcrumb 
            path={currentDirectory} 
            onNavigate={(dir) => setCurrentDirectory(dir)} 
            selectedFile={selectedFile}
          />
        </div>
      </div>

      {/* File Tree Content */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="min-w-fit">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files, currentDirectory)}
          />
          <input
            ref={folderInputRef}
            type="file"
            multiple
            // @ts-ignore
            webkitdirectory=""
            directory=""
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files, currentDirectory)}
          />

          {filteredFileSystem.map((item) => (
            <FileTreeItem
              key={item.path}
              item={item}
              level={0}
              selectedFile={selectedFile}
              selectedItems={selectedItems}
              expandedFolders={expandedFolders}
              loading={loading}
              isRenaming={isRenaming}
              isCreatingNew={isCreatingNew}
              newItemName={newItemName}
              onSelect={onFileSelect}
              onToggleExpand={handleToggleExpand}
              onRename={onRenameItem}
              onContextMenu={handleContextMenu}
              onCreateItem={onCreateItem}
              onClick={handleItemClick}
              setIsRenaming={setIsRenaming}
              setIsCreatingNew={setIsCreatingNew}
              setNewItemName={setNewItemName}
              lastTextFile={lastTextFile}
            />
          ))}
          {isCreatingNew && isCreatingNew.path === '' && (
            <div className="flex items-center mt-2">
              <input
                ref={newItemInputRef}
                type="text"
                value={newItemName}
                onChange={(e) => {
                  setNewItemName(e.target.value);
                  requestAnimationFrame(() => {
                    if (newItemInputRef.current) {
                      newItemInputRef.current.focus();
                    }
                  });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newItemName.trim()) {
                    onCreateItem(isCreatingNew.type, '', newItemName);
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
                    onCreateItem(isCreatingNew.type, '', newItemName);
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
        </div>
      </div>

      {/* Storage Usage Bar */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-3 py-2">
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
          Storage Used: {(projectSize / (1024 * 1024)).toFixed(1)}MB / {(storageLimit / (1024 * 1024)).toFixed(0)}MB
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              projectSize > storageLimit * 0.9 ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{
              width: `${Math.min((projectSize / storageLimit) * 100, 100)}%`
            }}
          />
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          options={getContextMenuOptions()}
        />
      )}

      {/* Progress Indicator */}
      <ProgressIndicator
        operations={operations}
        onClose={removeOperation}
      />

      {/* Keyboard Shortcut Help */}
      {showShortcutHelp && (
        <KeyboardShortcutHelp onClose={() => setShowShortcutHelp(false)} />
      )}

      {/* Image Paste Dialog */}
      {pastedImage && (
        <ImagePasteDialog
          imageData={pastedImage.data}
          suggestedName={pastedImage.suggestedName}
          onClose={() => setPastedImage(null)}
          onSave={handleSavePastedImage}
        />
      )}
    </div>
  );
} 