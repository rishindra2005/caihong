'use client';

import { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import MonacoEditor from '@/components/editor/MonacoEditor';
import CodeMirrorEditor from '@/components/editor/CodeMirrorEditor';
import FileExplorer from '@/components/files/FileExplorer';
import MultiViewerPanel from '@/components/viewers/MultiViewerPanel';
import path from 'path';
import { ArrowPathIcon, ArrowsRightLeftIcon, CogIcon } from '@heroicons/react/24/outline';
import { 
  isPdf, 
  isImage, 
  isVideo, 
  isAudio, 
  isTextOrCode, 
  getEditorLanguage 
} from '@/lib/utils/mediaUtils';
import {
  Panel,
  PanelGroup,
  PanelResizeHandle
} from 'react-resizable-panels';
import { Spinner } from '../ui/Spinner';
import { LoadingScreen, LoadingStage } from '../ui/LoadingScreen';
import ProjectSettingsModal, { ProjectSettings, defaultSettings } from '../settings/ProjectSettings';
import { setProjectHandlers } from './ProjectDashboardWrapper';
import React from 'react';

interface FileSystemItem {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileSystemItem[];
}

interface ProjectDashboardProps {
  projectId: string;
  initialPath?: string;
}

// Stable code editor component
const CodeEditor = memo(({ 
  file, 
  initialContent, 
  onSave,
  settings,
  currentSelection,
  onCompile
}: { 
  file: string | null;
  initialContent: string;
  onSave: (content: string) => Promise<void>;
  settings: ProjectSettings;
  currentSelection: string | null;
  onCompile?: () => void;
}) => {
  // Internal content state - this prevents parent re-renders from affecting the editor
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  
  // Update internal content when file changes
  useEffect(() => {
    setContent(initialContent);
  }, [file, initialContent]);
  
  // Enhanced save function to maintain focus
  const handleSave = async (contentToSave: string) => {
    if (!contentToSave || isSaving || !file) return;
    
    try {
      setIsSaving(true);
      
      // Store active element information more reliably
      const activeElement = document.activeElement;
      const selectionStart = activeElement instanceof HTMLTextAreaElement ? activeElement.selectionStart : null;
      const selectionEnd = activeElement instanceof HTMLTextAreaElement ? activeElement.selectionEnd : null;
      
      // Don't await the save operation - let it run in the background
      // This prevents the editor from losing focus during save
      onSave(contentToSave).catch(error => {
        console.error('Error saving file:', error);
      }).finally(() => {
        setIsSaving(false);
      });
      
      // Note: we don't try to restore focus here since we're not waiting for the save to complete
      // This prevents the focus loss in the first place
    } catch (error) {
      console.error('Error initiating save:', error);
      setIsSaving(false);
    }
  };
  
  // Render either Monaco or CodeMirror editor based on settings
  return file ? (
    <div className="h-full w-full relative" ref={editorContainerRef}>
      {settings.editorType === 'monaco' ? (
        <MonacoEditor
          key={`monaco-${file}`}
          initialValue={content}
          language={getEditorLanguage(file)}
          onChange={(value) => {
            if (value) {
              setContent(value);
            }
          }}
          readOnly={false}
          onSave={handleSave}
          // Pass settings to Monaco editor
          theme={settings.editorTheme === 'system' ? 'auto' : settings.editorTheme}
          options={{
            wordWrap: settings.wordWrap,
            fontSize: settings.fontSize,
            tabSize: settings.tabSize,
            scrollBeyondLastLine: settings.horizontalScroll,
            minimap: {
              enabled: settings.showMinimap
            }
          }}
          onCompile={onCompile}
        />
      ) : (
        <CodeMirrorEditor
          key={`codemirror-${file}`}
          initialValue={content}
          language={getEditorLanguage(file)}
          onChange={(value) => {
            if (value) {
              setContent(value);
            }
          }}
          readOnly={false}
          onSave={handleSave}
          // Pass settings to CodeMirror editor
          theme={settings.editorTheme === 'system' ? 'auto' : settings.editorTheme}
          options={{
            wordWrap: settings.wordWrap,
            fontSize: settings.fontSize,
            tabSize: settings.tabSize,
            scrollBeyondLastLine: settings.horizontalScroll,
            minimap: {
              enabled: settings.showMinimap
            }
          }}
        />
      )}
    </div>
  ) : (
    <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800">
      <div className="text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">Select a text file to edit</p>
        {currentSelection && (
          <p className="text-xs mt-2 text-gray-400 dark:text-gray-500">
            Current selection ({path.basename(currentSelection)}) is not a text file
          </p>
        )}
      </div>
    </div>
  );
});

// Empty state component
const EmptyState = memo(() => (
  <div className="flex items-center justify-center h-full w-full text-gray-500">
    Select a file to edit
  </div>
));

// --- Network Status Hook ---
function useNetworkStatus(pingUrl = '/api/ping', interval = 1000) {
  const [isConnected, setIsConnected] = useState(true);
  const [lastDisconnect, setLastDisconnect] = useState<number | null>(null);
  const [lastReconnect, setLastReconnect] = useState<number | null>(null);
  const [disconnectDuration, setDisconnectDuration] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Ping function
  const ping = useCallback(async () => {
    try {
      const res = await fetch(pingUrl, { cache: 'no-store' });
      if (res.ok) {
        if (!isConnected) {
          setIsConnected(true);
          setLastReconnect(Date.now());
        }
      } else {
        if (isConnected) {
          setIsConnected(false);
          setLastDisconnect(Date.now());
        }
      }
    } catch {
      if (isConnected) {
        setIsConnected(false);
        setLastDisconnect(Date.now());
      }
    }
  }, [pingUrl, isConnected]);

  // Polling effect
  useEffect(() => {
    intervalRef.current = setInterval(ping, interval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [ping, interval]);

  // Disconnect duration timer
  useEffect(() => {
    if (!isConnected && lastDisconnect) {
      timerRef.current = setInterval(() => {
        setDisconnectDuration(Date.now() - lastDisconnect);
      }, 100);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else {
      setDisconnectDuration(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isConnected, lastDisconnect]);

  // Reset disconnect timer on reconnect
  useEffect(() => {
    if (isConnected) setDisconnectDuration(0);
  }, [isConnected]);

  // Expose reconnect trigger
  const reconnect = useCallback(() => {
    ping();
  }, [ping]);

  return {
    isConnected,
    lastDisconnect,
    lastReconnect,
    disconnectDuration,
    reconnect,
  };
}

// --- Floating Network Notification ---
function NetworkStatusNotification({
  isConnected,
  disconnectDuration,
  reconnect,
  fileName,
  editorContent,
  show,
}: {
  isConnected: boolean;
  disconnectDuration: number;
  reconnect: () => void;
  fileName: string;
  editorContent: string;
  show: boolean;
}) {
  const [showConnected, setShowConnected] = useState(false);
  const [showDisconnected, setShowDisconnected] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>('progress.txt');

  // Show/hide logic
  useEffect(() => {
    if (!isConnected && show) {
      setShowDisconnected(true);
      setShowConnected(false);
    } else if (isConnected && show) {
      setShowConnected(true);
      setShowDisconnected(false);
      const timer = setTimeout(() => setShowConnected(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, show]);

  // Download logic
  const handleDownload = () => {
    if (!editorContent) return;
    const blob = new Blob([editorContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    setDownloadUrl(url);
    setDownloadName(fileName || 'progress.txt');
    setTimeout(() => {
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'progress.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadUrl(null);
    }, 100);
  };

  if (!show) return null;

  return (
    <>
      {showDisconnected && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[1000] bg-red-600 text-white px-6 py-4 rounded-lg shadow-lg flex flex-col items-center animate-fade-in">
          <div className="flex items-center space-x-2">
            <span className="font-semibold">Network disconnected</span>
            <svg className="w-5 h-5 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 11-12.728 0M12 3v9" /></svg>
          </div>
          <div className="mt-2 text-sm">Disconnected for {(disconnectDuration / 1000).toFixed(1)}s</div>
          <div className="flex gap-3 mt-3">
            <button onClick={reconnect} className="px-3 py-1 bg-white text-red-600 rounded shadow hover:bg-gray-100 font-medium">Reconnect</button>
            <button onClick={handleDownload} className="px-3 py-1 bg-blue-600 text-white rounded shadow hover:bg-blue-700 font-medium">Download Progress</button>
          </div>
        </div>
      )}
      {showConnected && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[1000] bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center animate-fade-in">
          <span className="font-semibold">Network connected</span>
          <svg className="w-5 h-5 text-white ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
      )}
    </>
  );
}

export default function ProjectDashboard({ projectId, initialPath }: ProjectDashboardProps) {
  const [fileSystem, setFileSystem] = useState<FileSystemItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [lastTextFile, setLastTextFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState<{ type: string; path: string } | null>(null);
  const [clipboard, setClipboard] = useState<{ type: 'cut' | 'copy'; paths: string[] } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [projectSize, setProjectSize] = useState<number>(0);
  const [storageLimit, setStorageLimit] = useState<number>(52428800); // Default 50MB
  // New state for viewer panel
  const [activeTab, setActiveTab] = useState<'pdf' | 'media' | 'logs' | 'ai' | 'history' | 'shell' | 'texlogs'>('pdf');
  const [logMessages, setLogMessages] = useState<{type: 'info' | 'error' | 'warning'; message: string; timestamp: Date}[]>([]);
  const [pdfViewerType, setPdfViewerType] = useState<'internal' | 'browser'>('internal');
  const [viewerContent, setViewerContent] = useState<{
    url: string;
    type: string;
    title: string;
  } | null>(null);
  const [isPanelsSwapped, setIsPanelsSwapped] = useState(false);
  const [project, setProject] = useState<{ name: string; description: string } | null>(null);
  const [projectSettings, setProjectSettings] = useState<ProjectSettings>(defaultSettings);
  const router = useRouter();
  const lastSaveTimestamp = useRef<number | null>(null);
  const autoCommitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const periodicChangeCheckRef = useRef<NodeJS.Timeout | null>(null);
  const lastCommitTimestamp = useRef<number | null>(null);
  const pendingChangesRef = useRef<Set<string>>(new Set());
  // Add the new state variables to handle editor dismounting during revert
  const [isReverting, setIsReverting] = useState(false);
  const [fileToRevert, setFileToRevert] = useState<string | null>(null);
  const [revertContent, setRevertContent] = useState<string | null>(null);
  // New state for loading screen
  const [isInitializing, setIsInitializing] = useState(true);
  const [loadingStages, setLoadingStages] = useState<LoadingStage[]>([
    { id: 'files', label: 'Loading file structure...', completed: false },
    { id: 'project', label: 'Fetching project details...', completed: false },
    { id: 'settings', label: 'Applying your settings...', completed: false },
    { id: 'git', label: 'Initializing version control...', completed: false },
    { id: 'editor', label: 'Preparing editor environment...', completed: false },
  ]);
  // Add a new state for download confirmation dialog
  const [downloadConfirmation, setDownloadConfirmation] = useState<{
    filePath: string;
    fileName: string;
  } | null>(null);
  // Add state for settings modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // --- Network status state ---
  const {
    isConnected: networkConnected,
    disconnectDuration,
    reconnect,
  } = useNetworkStatus();

  // Add state to track viewer refresh triggers
  const [refreshViewerTrigger, setRefreshViewerTrigger] = useState<number>(0);

  // Helper function to update loading stage completion
  const completeLoadingStage = useCallback((stageId: string) => {
    setLoadingStages(prev => 
      prev.map(stage => 
        stage.id === stageId ? { ...stage, completed: true } : stage
      )
    );
  }, []);

  // Fetch file system data
  const fetchFileSystem = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/files`);
      if (!response.ok) throw new Error('Failed to fetch file system');
      const data = await response.json();
      setFileSystem(data.fileSystem);
      setProjectSize(data.projectSize || 0);
      setStorageLimit(data.storageLimit || 52428800);
      completeLoadingStage('files');
    } catch (error) {
      console.error('Error fetching file system:', error);
      addLogMessage('error', 'Failed to fetch file system');
    }
  };

  // Helper function to add log messages
  const addLogMessage = useCallback((type: 'info' | 'error' | 'warning', message: string) => {
    setLogMessages(prev => [
      { type, message, timestamp: new Date() },
      ...prev
    ]);
    
    // Activate logs tab if it's an error
    if (type === 'error') {
      setActiveTab('logs');
    }
  }, []);

  // File operations
  const createItem = useCallback(async (type: 'file' | 'directory', parentPath: string, name: string) => {
    try {
      // Ensure path joining is done properly to create the correct path
      const itemPath = parentPath ? `${parentPath}/${name}` : name;
      setLoading({ type: 'create', path: itemPath });
      
      const response = await fetch(`/api/projects/${projectId}/files/operations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type, 
          parentPath: parentPath, // Send the parent path as is
          name 
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create item');
      }
      
      await fetchFileSystem();
      addLogMessage('info', `Created ${type} '${name}' ${parentPath ? `in ${parentPath}` : 'in root'}`);
    } catch (error) {
      console.error('Error creating item:', error);
      addLogMessage('error', `Failed to create ${type}: ${error instanceof Error ? error.message : 'unknown error'}`);
    } finally {
      setLoading(null);
    }
  }, [projectId, addLogMessage, fetchFileSystem]);

  const deleteItem = async (itemPath: string) => {
    try {
      setLoading({ type: 'delete', path: itemPath });
      const response = await fetch(`/api/projects/${projectId}/files/operations`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: [itemPath] }),
      });
      if (!response.ok) throw new Error('Failed to delete item');
      
      // Clear the editor if the currently selected file is deleted
      if (selectedFile === itemPath) {
        setSelectedFile(null);
        setFileContent('');
        setViewerContent(null); // Clear viewer content
      }
      
      await fetchFileSystem();
      addLogMessage('info', `Deleted '${path.basename(itemPath)}'`);
    } catch (error) {
      console.error('Error deleting item:', error);
      addLogMessage('error', `Failed to delete item: ${error instanceof Error ? error.message : 'unknown error'}`);
    } finally {
      setLoading(null);
    }
  };

  const bulkDeleteItems = async (itemPaths: string[]) => {
    try {
      // For UI feedback, just show loading state on the first item
      if (itemPaths.length > 0) {
        setLoading({ type: 'delete', path: itemPaths[0] });
      }
      
      const response = await fetch(`/api/projects/${projectId}/files/operations`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: itemPaths }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data.error || 'Failed to delete items';
        addLogMessage('error', errorMessage);
        throw new Error(errorMessage);
      }
      
      // Clear the editor if the currently selected file is among the deleted
      if (selectedFile && itemPaths.includes(selectedFile)) {
        setSelectedFile(null);
        setFileContent('');
        setViewerContent(null); // Clear viewer content
      }
      
      await fetchFileSystem();
      addLogMessage('info', `Deleted ${itemPaths.length} item(s)`);
    } catch (error) {
      console.error('Error deleting items:', error);
      addLogMessage('error', `Failed to delete items: ${error instanceof Error ? error.message : 'unknown error'}`);
    } finally {
      setLoading(null);
    }
  };

  const renameItem = async (oldPath: string, newName: string) => {
    try {
      setLoading({ type: 'rename', path: oldPath });
      const response = await fetch(`/api/projects/${projectId}/files/operations`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPath, newName }),
      });
      if (!response.ok) throw new Error('Failed to rename item');
      if (selectedFile === oldPath) {
        const newPath = path.join(path.dirname(oldPath), newName);
        setSelectedFile(newPath);
      }
      await fetchFileSystem();
      addLogMessage('info', `Renamed '${path.basename(oldPath)}' to '${newName}'`);
    } catch (error) {
      console.error('Error renaming item:', error);
      addLogMessage('error', `Failed to rename item: ${error instanceof Error ? error.message : 'unknown error'}`);
    } finally {
      setLoading(null);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    addLogMessage('info', 'Refreshing file system...');
    await fetchFileSystem();
    setIsRefreshing(false);
    addLogMessage('info', 'File system refreshed');
  };

  const handleCopy = (paths: string[], type: 'cut' | 'copy') => {
    setClipboard({ type, paths });
    addLogMessage('info', `${type === 'cut' ? 'Cut' : 'Copied'} ${paths.length} item(s)`);
  };

  const pasteItem = async (targetPath: string) => {
    if (!clipboard || clipboard.paths.length === 0) return;

    try {
      setLoading({ type: 'paste', path: targetPath });
      const response = await fetch(`/api/projects/${projectId}/files/operations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'paste',
          parentPath: targetPath,
          sourcePaths: clipboard.paths,
          operation: clipboard.type
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data.error || 'Failed to paste items';
        addLogMessage('error', errorMessage);
        throw new Error(errorMessage);
      }
      
      // Clear clipboard if it was a cut operation
      if (clipboard.type === 'cut') {
        setClipboard(null);
      }
      
      await fetchFileSystem();
      addLogMessage('info', `Pasted ${clipboard.paths.length} item(s) to ${targetPath || 'root'}`);
    } catch (error) {
      console.error('Error pasting items:', error);
      addLogMessage('error', `Failed to paste items: ${error instanceof Error ? error.message : 'unknown error'}`);
    } finally {
      setLoading(null);
    }
  };

  // Force remount of viewer content
  const forceRefreshViewer = useCallback(() => {
    setRefreshViewerTrigger(prev => prev + 1);
  }, []);

  // File content operations
  const fetchFileContent = async (filePath: string) => {
    try {
      setLoading({ type: 'fetch', path: filePath });
      
      // Handle media files differently based on type
      if (isPdf(filePath)) {
        setSelectedFile(filePath);
        setActiveTab('pdf');
        
        // Get the file URL
        const fileUrl = `/api/projects/${projectId}/files/view?path=${encodeURIComponent(filePath)}`;
        
        // Set viewer content with the PDF file info
        setViewerContent({
          url: fileUrl,
          type: 'pdf',
          title: path.basename(filePath)
        });
        
        // Force refresh the viewer to remount PDF
        forceRefreshViewer();
        
        addLogMessage('info', `Opened ${path.basename(filePath)} in ${pdfViewerType} PDF viewer`);
        setLoading(null);
        return;
      }
      
      // For images
      if (isImage(filePath)) {
        setSelectedFile(filePath);
        setActiveTab('media');
        const fileUrl = `/api/projects/${projectId}/files/view?path=${encodeURIComponent(filePath)}`;
        setViewerContent({
          url: fileUrl,
          type: 'image',
          title: path.basename(filePath)
        });
        
        // Force refresh the viewer to remount image
        forceRefreshViewer();
        
        addLogMessage('info', `Opened ${path.basename(filePath)}`);
        setLoading(null);
        return;
      }
      
      // For videos
      if (isVideo(filePath)) {
        setSelectedFile(filePath);
        setActiveTab('media');
        const fileUrl = `/api/projects/${projectId}/files/view?path=${encodeURIComponent(filePath)}`;
        setViewerContent({
          url: fileUrl,
          type: 'video',
          title: path.basename(filePath)
        });
        
        // Force refresh the viewer to remount video
        forceRefreshViewer();
        
        addLogMessage('info', `Opened video: ${path.basename(filePath)}`);
        setLoading(null);
        return;
      }
      
      // For audio files
      if (isAudio(filePath)) {
        setSelectedFile(filePath);
        setActiveTab('media');
        const fileUrl = `/api/projects/${projectId}/files/view?path=${encodeURIComponent(filePath)}`;
        setViewerContent({
          url: fileUrl,
          type: 'audio',
          title: path.basename(filePath)
        });
        
        // Force refresh the viewer to remount audio
        forceRefreshViewer();
        
        addLogMessage('info', `Opened audio: ${path.basename(filePath)}`);
        setLoading(null);
        return;
      }
      
      // For text/code files, use the Monaco editor
      if (isTextOrCode(filePath)) {
        await openInEditor(filePath);
        return;
      }
      
      // For unknown types, try to open as text first
      try {
        await openInEditor(filePath, true);
        return;
      } catch (error) {
        // Instead of downloading directly, prompt the user first
        addLogMessage('info', `File type cannot be opened in the editor: ${path.basename(filePath)}`);
        setDownloadConfirmation({
          filePath: filePath,
          fileName: path.basename(filePath)
        });
      }
    } catch (error) {
      console.error('Error fetching file content:', error);
      addLogMessage('error', `Failed to load file: ${error instanceof Error ? error.message : 'unknown error'}`);
      setSelectedFile(null);
    } finally {
      setLoading(null);
    }
  };

  // Handle actual download when confirmed
  const handleDownloadConfirmed = useCallback((filePath: string) => {
    const fileUrl = `/api/projects/${projectId}/files/download?path=${encodeURIComponent(filePath)}`;
    window.open(fileUrl, '_blank');
    setDownloadConfirmation(null);
    addLogMessage('info', `Downloading ${path.basename(filePath)}`);
  }, [projectId, addLogMessage]);

  // Helper function to open a file in the editor
  const openInEditor = async (filePath: string, isUnknownType = false) => {
    const response = await fetch(`/api/projects/${projectId}/files/content?path=${encodeURIComponent(filePath)}`);
    const data = await response.json();
    
    if (!response.ok) {
      if (response.status === 400 && data.error) {
        // Show error message for binary files or unsupported encodings
        addLogMessage('error', data.error);
        setSelectedFile(null);
        throw new Error(data.error || 'Cannot open file as text');
      }
      throw new Error('Failed to fetch file content');
    }

    // If we get here, we successfully opened the file as text
    setFileContent(data.content);
    setSelectedFile(filePath);
    // Also update the last text file reference when we open a text file
    setLastTextFile(filePath);
    
    if (isUnknownType) {
      addLogMessage('info', `Opened ${path.basename(filePath)} as text (unrecognized file type)`);
    } else {
      addLogMessage('info', `Opened ${path.basename(filePath)}`);
    }
  };

  // Update project name (now used by the ProjectHeader component)
  const updateProjectName = useCallback(async (newName: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newName,
          description: project?.description || ''
        }),
      });
      
      if (response.ok) {
        const updatedProject = await response.json();
        setProject(updatedProject);
        addLogMessage('info', `Project renamed to '${newName}'`);
      } else {
        addLogMessage('error', 'Failed to update project name');
      }
    } catch (error) {
      console.error('Error updating project name:', error);
      addLogMessage('error', 'Error updating project name');
    }
  }, [projectId, project, addLogMessage]);

  // Toggle panel positions (used by ProjectHeader)
  const togglePanelPositions = useCallback(() => {
    setIsPanelsSwapped(prev => !prev);
    addLogMessage('info', 'Swapped editor and viewer panels');
  }, [addLogMessage]);

  // Execute the auto-commit with the list of changed files
  const executeAutoCommit = useCallback(async () => {
    try {
      if (!projectSettings.gitEnabled || pendingChangesRef.current.size === 0) return;
      
      // Format changed files for commit message
      const changedFiles = Array.from(pendingChangesRef.current);
      let commitMessage: string;
      
      if (changedFiles.length === 1) {
        commitMessage = `Auto-commit changes to ${changedFiles[0]}`;
      } else if (changedFiles.length <= 3) {
        commitMessage = `Auto-commit changes to multiple files: ${changedFiles.join(', ')}`;
      } else {
        commitMessage = `Auto-commit changes to ${changedFiles.length} files`;
      }
      
      const response = await fetch(`/api/projects/${projectId}/git`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: commitMessage }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to auto-commit');
      }
      
      // Reset pending changes after successful commit
      pendingChangesRef.current.clear();
      
      // Update last commit timestamp
      lastCommitTimestamp.current = Date.now();
      
      addLogMessage('info', commitMessage);
    } catch (error) {
      console.error('Error executing auto-commit:', error);
      // Don't show error in UI for auto-commits to avoid disrupting the user
    }
  }, [projectId, projectSettings.gitEnabled, addLogMessage]);

  // Enhanced auto-commit system
  // This function checks for changes and schedules auto-commits
  const checkForChangesAndScheduleCommit = useCallback(async () => {
    try {
      if (!projectSettings.gitEnabled) return;

      // Check for uncommitted changes via Git status API
      const response = await fetch(`/api/projects/${projectId}/git`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        console.error('Failed to check Git status');
        return;
      }
      
      const data = await response.json();
      
      // If there are uncommitted changes
      if (data.status?.hasChanges) {
        // Record the modified files
        if (data.status.modifiedFiles) {
          data.status.modifiedFiles.forEach((file: string) => {
            pendingChangesRef.current.add(file);
          });
        }
        
        // Calculate time since last commit
        const now = Date.now();
        const timeSinceLastActivity = lastSaveTimestamp.current ? now - lastSaveTimestamp.current : 0;
        const timeSinceLastCommit = lastCommitTimestamp.current ? now - lastCommitTimestamp.current : Infinity;
        
        // If enough time has passed since last save or commit
        if (timeSinceLastActivity >= projectSettings.autoCommitAfterInactivity &&
            timeSinceLastCommit >= 30000) { // At least 30 seconds since last commit to avoid excessive commits
          executeAutoCommit();
        } else if (autoCommitTimeoutRef.current === null) {
          // Schedule auto-commit after the inactivity period
          autoCommitTimeoutRef.current = setTimeout(() => {
            executeAutoCommit();
            autoCommitTimeoutRef.current = null;
          }, projectSettings.autoCommitAfterInactivity);
        }
      }
    } catch (error) {
      console.error('Error checking for changes:', error);
    }
  }, [projectId, projectSettings.gitEnabled, projectSettings.autoCommitAfterInactivity, executeAutoCommit]);

  // Original handleAutoCommit function for backward compatibility
  const handleAutoCommit = useCallback(async () => {
    try {
      if (!lastTextFile || !projectSettings.gitEnabled) return;
      
      // Add the current file to pending changes
      pendingChangesRef.current.add(lastTextFile);
      
      // Execute the auto-commit
      executeAutoCommit();
    } catch (error) {
      console.error('Error auto-committing:', error);
      // Don't show error in UI for auto-commits to avoid disrupting the user
    }
  }, [lastTextFile, projectSettings.gitEnabled, executeAutoCommit]);

  // Set up periodic change checking
  useEffect(() => {
    if (projectSettings.gitEnabled) {
      // Initial check
      checkForChangesAndScheduleCommit();
      
      // Set up periodic checks (every 2 minutes)
      periodicChangeCheckRef.current = setInterval(() => {
        checkForChangesAndScheduleCommit();
      }, 120000); // 2 minutes
    }
    
    return () => {
      // Clean up timers on unmount
      if (periodicChangeCheckRef.current) {
        clearInterval(periodicChangeCheckRef.current);
        periodicChangeCheckRef.current = null;
      }
      
      if (autoCommitTimeoutRef.current) {
        clearTimeout(autoCommitTimeoutRef.current);
        autoCommitTimeoutRef.current = null;
      }
    };
  }, [projectSettings.gitEnabled, checkForChangesAndScheduleCommit]);

  // Handle save - using useCallback to prevent unnecessary renders
  const handleSave = useCallback(async (content: string) => {
    // Only allow saving if we have a valid text file
    if (!lastTextFile) return;

    try {
      // Use a separate variable to track this specific save operation
      // This avoids UI state changes that might affect focus
      let saveCompleted = false;
      
      const response = await fetch(`/api/projects/${projectId}/files/content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          path: lastTextFile, 
          content
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save file');
      }
      
      saveCompleted = true;
      
      // Store the last saved timestamp for auto-commit
      const now = Date.now();
      lastSaveTimestamp.current = now;
      
      // Add the file to pending changes
      pendingChangesRef.current.add(lastTextFile);
      
      // Existing auto-commit scheduling logic
      if (projectSettings.gitEnabled && autoCommitTimeoutRef.current === null) {
        autoCommitTimeoutRef.current = setTimeout(() => {
          // Only auto-commit if enough time has passed since the last save
          const timeSinceLastSave = Date.now() - (lastSaveTimestamp.current || 0);
          if (timeSinceLastSave >= projectSettings.autoCommitAfterInactivity) {
            executeAutoCommit();
          }
          autoCommitTimeoutRef.current = null;
        }, projectSettings.autoCommitAfterInactivity);
      }
      
      // Don't update UI for successful saves to avoid focus disruption
      // Only add to logs for error states or if explicitly requested
      if (!saveCompleted) {
        addLogMessage('info', `Saved ${path.basename(lastTextFile)}`);
      }
    } catch (error) {
      console.error('Error saving file:', error);
      addLogMessage('error', `Failed to save file: ${error instanceof Error ? error.message : 'unknown error'}`);
      throw error; // Re-throw to let the editor handle the error state
    }
  }, [lastTextFile, projectId, addLogMessage, projectSettings.gitEnabled, projectSettings.autoCommitAfterInactivity, executeAutoCommit]);

  // Fetch project info with loading stage update
  const fetchProjectInfo = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (response.ok) {
        const projectData = await response.json();
        setProject(projectData);
        completeLoadingStage('project');
      } else {
        console.error('Failed to fetch project info');
      }
    } catch (error) {
      console.error('Error fetching project info:', error);
    }
  }, [projectId, completeLoadingStage]);

  // Toggle PDF viewer type
  const togglePdfViewerType = useCallback(() => {
    setPdfViewerType(prev => prev === 'internal' ? 'browser' : 'internal');
    addLogMessage('info', `Switched to ${pdfViewerType === 'internal' ? 'browser' : 'internal'} PDF viewer`);
    
    // If we have a PDF open, update the message to show the user the viewer changed
    if (viewerContent?.type === 'pdf' && selectedFile) {
      addLogMessage('info', `PDF viewer for ${path.basename(selectedFile)} changed to ${pdfViewerType === 'internal' ? 'browser' : 'internal'} mode`);
    }
  }, [pdfViewerType, viewerContent, selectedFile, addLogMessage]);

  // Fetch project settings with loading stage update
  const fetchProjectSettings = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/settings`);
      if (response.ok) {
        const data = await response.json();
        // Always ensure all default settings fields exist with proper initial values
        const mergedSettings = {
          ...defaultSettings,
          ...(data.settings || {})
        };
        setProjectSettings(mergedSettings);
        completeLoadingStage('settings');
      }
    } catch (error) {
      console.error('Error fetching project settings:', error);
      addLogMessage('error', 'Failed to load project settings');
    }
  }, [projectId, addLogMessage, completeLoadingStage]);

  // Update project settings
  const updateProjectSettings = useCallback(async (newSettings: ProjectSettings) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: newSettings }),
      });
      
      if (response.ok) {
        setProjectSettings(newSettings);
        addLogMessage('info', 'Project settings updated');
      } else {
        addLogMessage('error', 'Failed to update project settings');
      }
    } catch (error) {
      console.error('Error updating project settings:', error);
      addLogMessage('error', 'Error updating project settings');
      throw error;
    }
  }, [projectId, addLogMessage]);

  // Check and initialize Git repository with loading stage update
  const initializeGitIfNeeded = useCallback(async () => {
    if (!projectSettings.gitEnabled) {
      completeLoadingStage('git');
      return;
    }
    
    try {
      const response = await fetch(`/api/projects/${projectId}/git`, {
        method: 'GET'
      });
      
      // If the response is successful, Git is already initialized or has been initialized by the API
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error initializing Git:', errorData.error);
        addLogMessage('error', 'Failed to initialize Git repository');
      }
      
      completeLoadingStage('git');
    } catch (error) {
      console.error('Error initializing Git:', error);
      addLogMessage('error', 'Failed to initialize Git repository');
      completeLoadingStage('git');
    }
  }, [projectId, projectSettings.gitEnabled, addLogMessage, completeLoadingStage]);

  // Initialize project data on mount with loading screen
  useEffect(() => {
    const initializeProject = async () => {
      setIsInitializing(true);
      try {
        await Promise.all([
          fetchFileSystem(),
          fetchProjectInfo(),
          fetchProjectSettings()
        ]);
        
        // Mark the editor environment as ready
        completeLoadingStage('editor');
        
        if (initialPath) {
          await fetchFileContent(initialPath);
        }
      } catch (error) {
        console.error('Error initializing project:', error);
        addLogMessage('error', 'Failed to initialize project');
      } finally {
        // Add a slight delay to ensure smooth transition
        setTimeout(() => {
          setIsInitializing(false);
        }, 800);
      }
    };
    
    initializeProject();
  }, [projectId, initialPath, fetchProjectInfo, fetchProjectSettings, completeLoadingStage]);
  
  // Initialize Git after settings are loaded
  useEffect(() => {
    if (projectSettings.gitEnabled) {
      initializeGitIfNeeded();
    } else {
      completeLoadingStage('git');
    }
  }, [projectSettings.gitEnabled, initializeGitIfNeeded, completeLoadingStage]);

  // Register handlers for the navbar to access
  useEffect(() => {
    // Register project handlers with the global state
    setProjectHandlers({
      updateProjectName,
      togglePanelPositions,
      openSettings: () => setIsSettingsOpen(true),
      projectName: project?.name || "Project",
      projectId,
      selectedFile
    });

    return () => {
      // Clear handlers when component unmounts
      setProjectHandlers({
        updateProjectName: async () => {},
        togglePanelPositions: () => {},
        openSettings: () => {},
        projectName: "",
        projectId: "",
        selectedFile: null
      });
    };
  }, [updateProjectName, togglePanelPositions, project, projectId, selectedFile]);

  // Update the memoized viewer panel with selectedFile and refresh function
  const viewerPanel = useMemo(() => (
    <MultiViewerPanel
      activeTab={activeTab}
      onTabChange={setActiveTab}
      viewerContent={viewerContent}
      logMessages={logMessages}
      pdfViewerType={pdfViewerType}
      onTogglePdfViewerType={togglePdfViewerType}
      projectId={projectId}
      selectedFile={selectedFile}
      onRefreshFileExplorer={handleRefresh}
      refreshTrigger={refreshViewerTrigger}
    />
  ), [activeTab, viewerContent, logMessages, pdfViewerType, togglePdfViewerType, projectId, selectedFile, handleRefresh, refreshViewerTrigger]);

  // Compile handler: dispatch a custom event to trigger compile in navbar
  const handleCompile = useCallback(() => {
    window.dispatchEvent(new CustomEvent('trigger-compile'));
  }, []);

  const editorPanel = useMemo(() => (
    <div className="flex-1 flex flex-col h-full w-full">
      <CodeEditor 
        file={lastTextFile} 
        initialContent={fileContent} 
        onSave={handleSave}
        settings={projectSettings}
        currentSelection={selectedFile}
        onCompile={handleCompile}
      />
    </div>
  ), [lastTextFile, fileContent, handleSave, projectSettings, selectedFile, handleCompile]);

  // Add a custom event listener for file revert events
  useEffect(() => {
    // Custom event handler for file revert
    const handleFileRevert = (event: CustomEvent<{ filePath: string, content: string, checkoutMode: string }>) => {
      const { filePath, content, checkoutMode } = event.detail;
      
      // Only process if this is the currently selected text file
      if (lastTextFile && lastTextFile === filePath) {
        // Set reverting state to dismount editor
        setIsReverting(true);
        setFileToRevert(filePath);
        setRevertContent(content);
        
        // Log message
        addLogMessage('info', `Reverting ${path.basename(filePath)} using ${checkoutMode} mode`);
      }
    };

    // Add event listener
    window.addEventListener('file-revert' as any, handleFileRevert as EventListener);
    
    // Clean up
    return () => {
      window.removeEventListener('file-revert' as any, handleFileRevert as EventListener);
    };
  }, [lastTextFile, addLogMessage]);

  // Process file revert after dismounting
  useEffect(() => {
    if (isReverting && fileToRevert && revertContent !== null) {
      const processRevert = async () => {
        try {
          // Update the file with the reverted content
          if (lastTextFile === fileToRevert) {
            // Update editor content
            setFileContent(revertContent);
            
            // Force refresh file system to reflect git checkout changes
            await fetchFileSystem();
            
            addLogMessage('info', `Successfully reverted ${path.basename(fileToRevert)}`);
          }
        } catch (error) {
          console.error('Error processing revert:', error);
          addLogMessage('error', `Failed to revert ${fileToRevert}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
          // Remount editor
          setIsReverting(false);
          setFileToRevert(null);
          setRevertContent(null);
        }
      };

      processRevert();
    }
  }, [isReverting, fileToRevert, revertContent, lastTextFile, addLogMessage, fetchFileSystem]);

  // Add a custom event listener for Git reset events
  useEffect(() => {
    // Custom event handler for Git reset
    const handleGitReset = (event: CustomEvent<{ resetMode: string }>) => {
      const { resetMode } = event.detail;
      
      // Log the reset
      addLogMessage('info', `Project was reset using ${resetMode} mode. Refreshing project state...`);
      
      // For hard resets, we need to reload all data
      if (resetMode === 'hard') {
        // Remount editor to avoid conflicts
        setIsReverting(true);
        
        // Refresh project data
        Promise.all([
          fetchFileSystem(),
          fetchProjectInfo(),
          fetchProjectSettings()
        ]).then(() => {
          // If there's a selected text file, refresh its content
          if (lastTextFile) {
            fetchFileContent(lastTextFile);
          }
          
          // Re-enable editor
          setIsReverting(false);
          addLogMessage('info', 'Project refreshed after Git reset');
        });
      } else {
        // For soft and mixed resets, just refresh the file system
        fetchFileSystem();
        addLogMessage('info', 'File system refreshed after Git reset');
      }
    };

    // Add event listener
    window.addEventListener('git-reset' as any, handleGitReset as EventListener);
    
    // Clean up
    return () => {
      window.removeEventListener('git-reset' as any, handleGitReset as EventListener);
    };
  }, [addLogMessage, fetchFileSystem, fetchProjectInfo, fetchProjectSettings, fetchFileContent, lastTextFile]);

  // Add event listeners for compilation events
  useEffect(() => {
    // Handler for successful compilation
    const handleCompilationCompleted = (event: CustomEvent) => {
      const { success, status, message, type, logs, errors, creditCharge, pdfPath } = event.detail;
      
      // Add message to logs
      addLogMessage(type, message);
      
      // If there were credits charged, add another message
      if (creditCharge > 0) {
        addLogMessage('info', `Compilation took longer than 2 seconds. ${creditCharge} credits deducted.`);
      }
      
      // If there are errors, add them to logs
      if (errors && Array.isArray(errors) && errors.length > 0) {
        errors.forEach((error: string) => {
          addLogMessage('error', `LaTeX Error: ${error}`);
        });
      }
      
      // Always try to set up the PDF viewer if a PDF was generated
      if (pdfPath) {
        setViewerContent({
          url: pdfPath,
          type: 'pdf',
          title: pdfPath.split('/').pop() || 'output.pdf'
        });
        
        // Force refresh the viewer to remount PDF after compilation
        forceRefreshViewer();
      }
      
      // Handle different compilation statuses for tab selection
      if (pdfPath) {
        // If PDF was generated (success or partial), show PDF first
        setActiveTab('pdf');
      } else {
        // No PDF generated (fatal error) - show TeX logs
        setActiveTab('texlogs');
      }
      
      // Always refresh the file explorer after compilation
      handleRefresh();
    };
    
    // Handler for compilation errors
    const handleCompilationError = (event: CustomEvent) => {
      const { message, details, pdfPath } = event.detail;
      
      // Add error message to logs
      addLogMessage('error', message);
      
      // If there are additional details, log them too
      if (details) {
        addLogMessage('error', `Details: ${details}`);
      }
      
      // Always try to check for a PDF regardless of error
      if (pdfPath) {
        setViewerContent({
          url: pdfPath,
          type: 'pdf',
          title: pdfPath.split('/').pop() || 'output.pdf'
        });
        
        // Force refresh the viewer to remount PDF even after errors
        forceRefreshViewer();
        
        // If we still have a PDF, show it instead of logs
        setActiveTab('pdf');
      } else {
        // Only show logs if no PDF is available (fatal error)
        setActiveTab('texlogs');
      }
      
      // Always refresh the file explorer after compilation
      handleRefresh();
    };
    
    // Handler for opening PDFs
    const handleOpenPdf = (event: CustomEvent) => {
      const { path, title } = event.detail;
      
      // Set viewer content with the PDF file
      setViewerContent({
        url: path,
        type: 'pdf',
        title: title
      });
      
      // Force refresh the viewer when opening a PDF
      forceRefreshViewer();
      
      // Switch to PDF tab
      setActiveTab('pdf');
    };

    // Additional handler for PDF ready event (from compilation)
    const handlePdfReady = (event: CustomEvent) => {
      const { path, title } = event.detail;
      
      // Set viewer content with the PDF file info
      setViewerContent({
        url: path,
        type: 'pdf',
        title: title
      });
      
      // Force refresh the viewer when PDF is ready
      forceRefreshViewer();
      
      // Switch to PDF tab
      setActiveTab('pdf');
    };
    
    // Add event listeners
    window.addEventListener('compilation-completed', handleCompilationCompleted as EventListener);
    window.addEventListener('compilation-success', handleCompilationCompleted as EventListener);
    window.addEventListener('compilation-error', handleCompilationError as EventListener);
    window.addEventListener('open-pdf', handleOpenPdf as EventListener);
    window.addEventListener('pdf-ready', handlePdfReady as EventListener);
    
    // Clean up
    return () => {
      window.removeEventListener('compilation-completed', handleCompilationCompleted as EventListener);
      window.removeEventListener('compilation-success', handleCompilationCompleted as EventListener);
      window.removeEventListener('compilation-error', handleCompilationError as EventListener);
      window.removeEventListener('open-pdf', handleOpenPdf as EventListener);
      window.removeEventListener('pdf-ready', handlePdfReady as EventListener);
    };
  }, [addLogMessage, setActiveTab, handleRefresh, setViewerContent, forceRefreshViewer]);

  // --- Floating network notification ---
  // Show notification if disconnected or just reconnected
  const showNetworkNotification = !networkConnected || disconnectDuration > 0;

  // The rest of the JSX
  return (
    <>
      <LoadingScreen isVisible={isInitializing} loadingStages={loadingStages} autoProgress={false} />
      
      {/* Settings Modal */}
      <ProjectSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={projectSettings}
        onSave={updateProjectSettings}
        projectId={projectId}
      />
      
      {/* Download Confirmation Dialog */}
      {downloadConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-3">Download File</h3>
            <p className="mb-5 text-gray-600 dark:text-gray-300">
              The file <span className="font-semibold">{downloadConfirmation.fileName}</span> cannot be opened in the editor. Would you like to download it instead?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDownloadConfirmation(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDownloadConfirmed(downloadConfirmation.filePath)}
                className="px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Network Status Floating Notification */}
      <NetworkStatusNotification
        isConnected={networkConnected}
        disconnectDuration={disconnectDuration}
        reconnect={reconnect}
        fileName={lastTextFile ? path.basename(lastTextFile) : ''}
        editorContent={fileContent}
        show={showNetworkNotification}
      />
      
      <div className="flex h-[calc(100vh-3rem)] w-full overflow-hidden">
        <PanelGroup direction="horizontal" className="w-full">
          {/* File Explorer (Left Column) */}
          <Panel defaultSize={20} minSize={15}>
            <div className="h-full w-full overflow-auto">
              <FileExplorer
                projectId={projectId}
                fileSystem={fileSystem}
                selectedFile={selectedFile}
                loading={loading}
                clipboard={clipboard}
                projectSize={projectSize}
                storageLimit={storageLimit}
                onFileSelect={(item) => fetchFileContent(item.path)}
                onCreateItem={createItem}
                onRenameItem={renameItem}
                onDeleteItem={bulkDeleteItems}
                onCopy={handleCopy}
                onPaste={pasteItem}
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
                hideDotFiles={projectSettings.hideDotFiles}
                hideFileExtensions={projectSettings.hideFileExtensions}
                lastTextFile={lastTextFile}
              />
            </div>
          </Panel>

          <PanelResizeHandle className="w-1.5 bg-gray-200 hover:bg-blue-500 transition-colors dark:bg-gray-700 dark:hover:bg-blue-600" />

          {/* Middle Panel */}
          <Panel defaultSize={40} minSize={20}>
            <div className="h-full w-full flex flex-col">
              <div className="flex-1 overflow-hidden w-full">
                {isPanelsSwapped ? viewerPanel : editorPanel}
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-1.5 bg-gray-200 hover:bg-blue-500 transition-colors dark:bg-gray-700 dark:hover:bg-blue-600" />

          {/* Right Panel */}
          <Panel defaultSize={40} minSize={20}>
            <div className="h-full w-full flex flex-col">
              <div className="flex-1 overflow-hidden w-full">
                {isPanelsSwapped ? editorPanel : viewerPanel}
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </>
  );
} 