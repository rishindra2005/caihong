'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  ClockIcon, 
  ChevronRightIcon, 
  DocumentTextIcon, 
  ArrowUturnLeftIcon 
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import {
  Panel,
  PanelGroup,
  PanelResizeHandle
} from 'react-resizable-panels';

interface Commit {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
  files: string[];
}

// Interface for a parsed diff line
interface DiffLine {
  type: 'addition' | 'deletion' | 'context' | 'info';
  content: string;
  lineNumber?: { old?: number; new?: number };
}

export default function HistoryPanel({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [gitEnabled, setGitEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [modifiedFiles, setModifiedFiles] = useState<string[]>([]);
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null);
  const [expandedCommits, setExpandedCommits] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [diff, setDiff] = useState<string>('');
  const [parsedDiff, setParsedDiff] = useState<DiffLine[]>([]);
  const [isDiffLoading, setIsDiffLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [isReverting, setIsReverting] = useState(false);
  const [revertSuccess, setRevertSuccess] = useState<string | null>(null);
  const [revertError, setRevertError] = useState<string | null>(null);
  const diffContainerRef = useRef<HTMLDivElement>(null);

  // Fetch Git history and status
  const fetchGitHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/projects/${projectId}/git`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch Git history');
      }
      
      setGitEnabled(data.gitEnabled);
      setCommits(data.commits || []);
      setHasChanges(data.status?.hasChanges || false);
      setModifiedFiles(data.status?.modifiedFiles || []);
      
      // Clear selection if the commit no longer exists
      if (selectedCommit && !data.commits.some((c: Commit) => c.hash === selectedCommit)) {
        setSelectedCommit(null);
        setSelectedFile(null);
        setDiff('');
        setParsedDiff([]);
      }
    } catch (error) {
      console.error('Error fetching Git history:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch Git history');
    } finally {
      setIsLoading(false);
    }
  };

  // Parse diff output into a structured format
  const parseDiff = (diffText: string): DiffLine[] => {
    if (!diffText) return [];
    
    const lines = diffText.split('\n');
    const result: DiffLine[] = [];
    let oldLineNumber = 0;
    let newLineNumber = 0;
    
    // Skip the first few lines that contain diff metadata
    let startingLine = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('@@')) {
        // Parse the @@ -a,b +c,d @@ line to get starting line numbers
        const match = lines[i].match(/@@ -(\d+),\d+ \+(\d+),\d+ @@/);
        if (match) {
          oldLineNumber = parseInt(match[1], 10);
          newLineNumber = parseInt(match[2], 10);
          result.push({ type: 'info', content: lines[i] });
          startingLine = i + 1;
          break;
        }
      }
    }
    
    // Process each line of the diff
    for (let i = startingLine; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('+')) {
        // Addition
        result.push({
          type: 'addition',
          content: line.substring(1),
          lineNumber: { new: newLineNumber++ }
        });
      } else if (line.startsWith('-')) {
        // Deletion
        result.push({
          type: 'deletion',
          content: line.substring(1),
          lineNumber: { old: oldLineNumber++ }
        });
      } else if (line.startsWith('@@')) {
        // New diff section
        const match = line.match(/@@ -(\d+),\d+ \+(\d+),\d+ @@/);
        if (match) {
          oldLineNumber = parseInt(match[1], 10);
          newLineNumber = parseInt(match[2], 10);
          result.push({ type: 'info', content: line });
        }
      } else {
        // Context line
        result.push({
          type: 'context',
          content: line.startsWith(' ') ? line.substring(1) : line,
          lineNumber: { old: oldLineNumber++, new: newLineNumber++ }
        });
      }
    }
    
    return result;
  };

  // Fetch diff for a specific file and commit
  const fetchDiff = async (commitHash: string, filePath: string) => {
    try {
      setIsDiffLoading(true);
      
      const response = await fetch(`/api/projects/${projectId}/git/diff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath,
          commitHash,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch diff');
      }
      
      const diffText = data.diff || 'No changes';
      setDiff(diffText);
      setParsedDiff(parseDiff(diffText));
      
      // Scroll diff container to top
      if (diffContainerRef.current) {
        diffContainerRef.current.scrollTop = 0;
      }
    } catch (error) {
      console.error('Error fetching diff:', error);
      setDiff('Error fetching diff: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setParsedDiff([]);
    } finally {
      setIsDiffLoading(false);
    }
  };

  // Commit changes
  const handleCommit = async () => {
    if (!hasChanges) return;
    
    try {
      setCommitting(true);
      
      const response = await fetch(`/api/projects/${projectId}/git`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: commitMessage || 'Manual commit',
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to commit changes');
      }
      
      // Refresh history
      await fetchGitHistory();
      setCommitMessage('');
    } catch (error) {
      console.error('Error committing changes:', error);
      setError('Failed to commit changes: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setCommitting(false);
    }
  };

  // Revert to file version
  const handleRevertFile = async (commitHash: string, filePath: string) => {
    if (!commitHash || !filePath) return;

    // Show a simplified modal for file checkout options
    const checkoutMode = await showFileCheckoutOptionDialog(commitHash, filePath);
    if (!checkoutMode) return; // User cancelled

    try {
      setIsReverting(true);
      setRevertSuccess(null);
      setRevertError(null);
      
      // Call the revert API with the new checkout mode
      const response = await fetch(`/api/projects/${projectId}/git/revert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commitHash,
          filePath,
          revertType: 'file',
          checkoutMode
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to revert file');
      }

      // Get the file content from the commit to update the editor
      const fileContent = await getFileContentFromCommit(commitHash, filePath);
      
      // Dispatch a custom event to notify ProjectDashboard to update the editor
      const revertEvent = new CustomEvent('file-revert', {
        detail: {
          filePath,
          content: fileContent,
          checkoutMode
        }
      });
      window.dispatchEvent(revertEvent);

      setRevertSuccess(`Successfully reverted ${filePath} to version ${commitHash.substring(0, 7)} using ${checkoutMode} mode`);
      
      // Force refresh
      router.refresh();
      
      // Refresh git history
      await fetchGitHistory();
    } catch (error) {
      console.error('Error reverting file:', error);
      setRevertError('Failed to revert file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsReverting(false);
    }
  };

  // Dialog to select file checkout options
  const showFileCheckoutOptionDialog = (commitHash: string, filePath: string): Promise<string | null> => {
    return new Promise((resolve) => {
      // Create modal container
      const modalContainer = document.createElement('div');
      modalContainer.className = 'fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50';
      document.body.appendChild(modalContainer);
      
      // Create modal content
      const modalContent = document.createElement('div');
      modalContent.className = 'bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md p-4';
      modalContainer.appendChild(modalContent);
      
      // Create modal header
      const header = document.createElement('div');
      header.className = 'text-lg font-bold mb-4 border-b pb-2 flex justify-between items-center';
      header.textContent = `Revert ${filePath.split('/').pop()}`;
      
      // Close button
      const closeButton = document.createElement('button');
      closeButton.className = 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300';
      closeButton.innerHTML = '&times;';
      closeButton.onclick = () => {
        document.body.removeChild(modalContainer);
        resolve(null);
      };
      header.appendChild(closeButton);
      modalContent.appendChild(header);
      
      // File info
      const fileInfo = document.createElement('div');
      fileInfo.className = 'mb-4 text-sm';
      fileInfo.innerHTML = `Restoring file from commit: <span class="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">${commitHash.substring(0, 7)}</span>`;
      modalContent.appendChild(fileInfo);
      
      // Warning message
      const warning = document.createElement('div');
      warning.className = 'mb-4 text-amber-600 dark:text-amber-400 text-sm bg-amber-50 dark:bg-amber-900/30 p-2 rounded';
      warning.textContent = 'This will replace the current version of this file with the version from the selected commit.';
      modalContent.appendChild(warning);
      
      // Options section
      const optionsSection = document.createElement('div');
      optionsSection.className = 'space-y-3 mb-4';
      
      // Checkout mode options
      const checkoutModes = [
        {
          value: 'checkout',
          title: 'Simple Checkout',
          description: 'Restore the file to this version, keeping your other changes.'
        },
        {
          value: 'checkout-force',
          title: 'Force Checkout',
          description: 'Restore the file even if you have unsaved modifications.'
        },
        {
          value: 'stage',
          title: 'Checkout and Stage',
          description: 'Restore the file and add it to staging area for commit.'
        }
      ];
      
      checkoutModes.forEach(mode => {
        const option = document.createElement('div');
        option.className = 'p-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer';
        
        const header = document.createElement('div');
        header.className = 'font-medium';
        header.textContent = mode.title;
        
        const description = document.createElement('div');
        description.className = 'text-sm text-gray-600 dark:text-gray-400';
        description.textContent = mode.description;
        
        option.appendChild(header);
        option.appendChild(description);
        
        option.onclick = () => {
          document.body.removeChild(modalContainer);
          resolve(mode.value);
        };
        
        optionsSection.appendChild(option);
      });
      
      modalContent.appendChild(optionsSection);
      
      // Cancel button
      const cancelButton = document.createElement('button');
      cancelButton.className = 'w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-center hover:bg-gray-100 dark:hover:bg-gray-700';
      cancelButton.textContent = 'Cancel';
      cancelButton.onclick = () => {
        document.body.removeChild(modalContainer);
        resolve(null);
      };
      modalContent.appendChild(cancelButton);
    });
  };

  // Helper function to get file content from a specific commit
  const getFileContentFromCommit = async (commitHash: string, filePath: string): Promise<string> => {
    try {
      const response = await fetch(`/api/projects/${projectId}/git/file-at-commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commitHash,
          filePath
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get file content');
      }
      
      return data.content || '';
    } catch (error) {
      console.error('Error getting file content:', error);
      throw error;
    }
  };

  // Revert to full version
  const handleRevertVersion = async (commitHash: string) => {
    if (!commitHash) return;
    
    // Create a custom modal for reset options
    const resetMode = await showResetOptionDialog(commitHash);
    if (!resetMode) return; // User cancelled
    
    try {
      setIsReverting(true);
      setRevertSuccess(null);
      setRevertError(null);

      const response = await fetch(`/api/projects/${projectId}/git/revert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commitHash,
          revertType: 'version',
          resetMode
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset to version');
      }

      setRevertSuccess(`Successfully reset to version ${commitHash.substring(0, 7)} using ${resetMode} mode`);
      
      // Dispatch an event to notify ProjectDashboard of the reset
      const resetEvent = new CustomEvent('git-reset', {
        detail: {
          commitHash,
          resetMode
        }
      });
      window.dispatchEvent(resetEvent);

      // Force refresh
      router.refresh();
      
      // Refresh git history
      await fetchGitHistory();
    } catch (error) {
      console.error('Error resetting to version:', error);
      setRevertError('Failed to reset to version: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsReverting(false);
    }
  };

  // Dialog to select reset mode
  const showResetOptionDialog = (commitHash: string): Promise<string | null> => {
    return new Promise((resolve) => {
      // Create modal container
      const modalContainer = document.createElement('div');
      modalContainer.className = 'fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50';
      document.body.appendChild(modalContainer);
      
      // Create modal content
      const modalContent = document.createElement('div');
      modalContent.className = 'bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md p-4';
      modalContainer.appendChild(modalContent);
      
      // Create modal header
      const header = document.createElement('div');
      header.className = 'text-lg font-bold mb-4 border-b pb-2 flex justify-between items-center';
      header.textContent = `Reset to version ${commitHash.substring(0, 7)}`;
      
      // Close button
      const closeButton = document.createElement('button');
      closeButton.className = 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300';
      closeButton.innerHTML = '&times;';
      closeButton.onclick = () => {
        document.body.removeChild(modalContainer);
        resolve(null);
      };
      header.appendChild(closeButton);
      modalContent.appendChild(header);
      
      // Warning message
      const warning = document.createElement('div');
      warning.className = 'mb-4 text-amber-600 dark:text-amber-400 text-sm bg-amber-50 dark:bg-amber-900/30 p-2 rounded';
      warning.textContent = 'Warning: This action will change your project history. Choose carefully.';
      modalContent.appendChild(warning);
      
      // Options section
      const optionsSection = document.createElement('div');
      optionsSection.className = 'space-y-3 mb-4';
      
      // Reset mode options
      const resetModes = [
        {
          value: 'soft',
          title: 'Soft Reset',
          description: 'Keep all changes in staging area. Safest option.'
        },
        {
          value: 'mixed',
          title: 'Mixed Reset (Default)',
          description: 'Keep all changes in working directory, unstaged.'
        },
        {
          value: 'hard',
          title: 'Hard Reset',
          description: 'Discard all changes since this commit. Dangerous!'
        }
      ];
      
      resetModes.forEach(mode => {
        const option = document.createElement('div');
        option.className = 'p-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer';
        
        const header = document.createElement('div');
        header.className = 'font-medium';
        header.textContent = mode.title;
        
        const description = document.createElement('div');
        description.className = 'text-sm text-gray-600 dark:text-gray-400';
        description.textContent = mode.description;
        
        option.appendChild(header);
        option.appendChild(description);
        
        option.onclick = () => {
          document.body.removeChild(modalContainer);
          resolve(mode.value);
        };
        
        optionsSection.appendChild(option);
      });
      
      modalContent.appendChild(optionsSection);
      
      // Cancel button
      const cancelButton = document.createElement('button');
      cancelButton.className = 'w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-center hover:bg-gray-100 dark:hover:bg-gray-700';
      cancelButton.textContent = 'Cancel';
      cancelButton.onclick = () => {
        document.body.removeChild(modalContainer);
        resolve(null);
      };
      modalContent.appendChild(cancelButton);
    });
  };

  // Toggle expanded state for a commit
  const toggleCommitExpanded = (hash: string) => {
    const newExpandedCommits = new Set(expandedCommits);
    if (newExpandedCommits.has(hash)) {
      newExpandedCommits.delete(hash);
    } else {
      newExpandedCommits.add(hash);
    }
    setExpandedCommits(newExpandedCommits);
  };

  // Format date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Select a commit and file to view diff
  const handleSelectFile = (commitHash: string, filePath: string) => {
    setSelectedCommit(commitHash);
    setSelectedFile(filePath);
    fetchDiff(commitHash, filePath);
  };

  // Load initial data
  useEffect(() => {
    fetchGitHistory();
    // Set up polling every 30 seconds to refresh
    const interval = setInterval(fetchGitHistory, 30000);
    return () => clearInterval(interval);
  }, [projectId]);

  // Clear success/error messages after 5 seconds
  useEffect(() => {
    if (revertSuccess || revertError) {
      const timeout = setTimeout(() => {
        setRevertSuccess(null);
        setRevertError(null);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [revertSuccess, revertError]);

  // Render the diff viewer with improved styling
  const renderDiffViewer = () => {
    if (isDiffLoading) {
      return <p className="text-gray-500 p-4">Loading diff...</p>;
    }
    
    if (!selectedFile) {
      return <p className="text-gray-500 p-4">Select a file from a commit to view changes</p>;
    }
    
    if (!parsedDiff.length) {
      return <p className="text-gray-500 p-4">No changes detected in this file</p>;
    }
    
    return (
      <div className="flex flex-col font-mono text-xs overflow-auto">
        <div className="sticky top-0 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2 z-10">
          <span className="font-medium">{selectedFile}</span>
        </div>
        
        <div className="flex-1 overflow-auto" ref={diffContainerRef}>
          <table className="w-full border-collapse">
            <tbody>
              {parsedDiff.map((line, index) => {
                if (line.type === 'info') {
                  return (
                    <tr key={index} className="bg-blue-50 dark:bg-blue-900/30">
                      <td className="w-10 pl-2 pr-1 text-right text-gray-500 select-none"></td>
                      <td className="w-10 pl-2 pr-1 text-right text-gray-500 select-none"></td>
                      <td className="pl-2 pr-2 whitespace-pre">{line.content}</td>
                    </tr>
                  );
                }
                
                if (line.type === 'addition') {
                  return (
                    <tr key={index} className="bg-green-50 dark:bg-green-900/30">
                      <td className="w-10 pl-2 pr-1 text-right text-gray-500 select-none"></td>
                      <td className="w-10 pl-2 pr-1 text-right text-gray-500 select-none">{line.lineNumber?.new}</td>
                      <td className="pl-2 pr-2 whitespace-pre text-green-700 dark:text-green-400">+ {line.content}</td>
                    </tr>
                  );
                }
                
                if (line.type === 'deletion') {
                  return (
                    <tr key={index} className="bg-red-50 dark:bg-red-900/30">
                      <td className="w-10 pl-2 pr-1 text-right text-gray-500 select-none">{line.lineNumber?.old}</td>
                      <td className="w-10 pl-2 pr-1 text-right text-gray-500 select-none"></td>
                      <td className="pl-2 pr-2 whitespace-pre text-red-700 dark:text-red-400">- {line.content}</td>
                    </tr>
                  );
                }
                
                return (
                  <tr key={index}>
                    <td className="w-10 pl-2 pr-1 text-right text-gray-500 select-none border-r border-gray-200 dark:border-gray-700">{line.lineNumber?.old}</td>
                    <td className="w-10 pl-2 pr-1 text-right text-gray-500 select-none border-r border-gray-200 dark:border-gray-700">{line.lineNumber?.new}</td>
                    <td className="pl-2 pr-2 whitespace-pre">{line.content}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (!gitEnabled) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-2 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium">Git History</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div>
            <ClockIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h4 className="text-lg font-medium mb-2">Git is disabled</h4>
            <p className="text-sm text-gray-500 max-w-md">
              Git version control is currently disabled for this project. 
              Enable it in project settings to track changes and view history.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-2 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium">Git History</h3>
        <button
          onClick={fetchGitHistory}
          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded"
        >
          Refresh
        </button>
      </div>

      {/* Status messages */}
      {(revertSuccess || revertError) && (
        <div className={`p-2 text-sm ${revertSuccess ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
          {revertSuccess || revertError}
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full">
          {/* Left panel - commit history */}
          <Panel id="commits" defaultSize={40} minSize={20}>
            <div className="h-full overflow-y-auto">
              {/* Uncommitted changes */}
              {hasChanges && (
                <div className="border-b border-gray-200 dark:border-gray-700 p-3">
                  <div className="mb-2">
                    <h4 className="text-sm font-semibold flex items-center">
                      Uncommitted Changes
                      <span className="ml-2 px-1.5 py-0.5 text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 rounded-full">
                        {modifiedFiles.length} file{modifiedFiles.length !== 1 ? 's' : ''}
                      </span>
                    </h4>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    {modifiedFiles.map((file) => (
                      <div 
                        key={file}
                        className="text-xs py-1 px-2 bg-gray-50 dark:bg-gray-800 rounded flex items-center"
                      >
                        <DocumentTextIcon className="w-3 h-3 mr-1 text-amber-600 dark:text-amber-400" />
                        <span className="truncate">{file}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <input
                      type="text"
                      placeholder="Commit message"
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <button
                      onClick={handleCommit}
                      disabled={committing}
                      className={`px-3 py-1 text-xs font-medium rounded ${
                        committing
                          ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      {committing ? 'Committing...' : 'Commit Changes'}
                    </button>
                  </div>
                </div>
              )}
              
              {/* Commit history */}
              {isLoading ? (
                <div className="p-4 text-center">
                  <p className="text-sm text-gray-500">Loading history...</p>
                </div>
              ) : error ? (
                <div className="p-4 text-center">
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              ) : commits.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-sm text-gray-500">No commit history found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {commits.map((commit) => (
                    <div key={commit.hash} className="p-3">
                      <div className="flex items-start justify-between">
                        <div 
                          className="flex items-start cursor-pointer flex-1"
                          onClick={() => toggleCommitExpanded(commit.hash)}
                        >
                          <ChevronRightIcon
                            className={`w-4 h-4 mt-1 mr-1 transform transition-transform ${
                              expandedCommits.has(commit.hash) ? 'rotate-90' : ''
                            }`}
                          />
                          <div className="flex-1">
                            <div className="flex items-center mb-1">
                              <span className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded mr-2">
                                {commit.shortHash}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(commit.date)}
                              </span>
                            </div>
                            <p className="text-sm font-medium">{commit.message}</p>
                            <p className="text-xs text-gray-500">
                              {commit.author}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRevertVersion(commit.hash)}
                          disabled={isReverting}
                          title="Revert to this version"
                          className="p-1 rounded text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-gray-800"
                        >
                          <ArrowUturnLeftIcon className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Expanded files list */}
                      {expandedCommits.has(commit.hash) && (
                        <div className="pl-6 mt-2 space-y-1">
                          {commit.files.map((file) => (
                            <div 
                              key={`${commit.hash}-${file}`}
                              className={`text-xs py-1 px-2 rounded flex items-center justify-between ${
                                selectedCommit === commit.hash && selectedFile === file
                                  ? 'bg-blue-100 dark:bg-blue-900'
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                              }`}
                            >
                              <div 
                                className="flex items-center flex-1 cursor-pointer"
                                onClick={() => handleSelectFile(commit.hash, file)}
                              >
                                <DocumentTextIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                                <span className="truncate">{file}</span>
                              </div>
                              <button
                                onClick={() => handleRevertFile(commit.hash, file)}
                                disabled={isReverting}
                                title="Revert this file to this version"
                                className="ml-2 p-1 rounded text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-gray-800"
                              >
                                <ArrowUturnLeftIcon className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Panel>
          
          {/* Resizable handle */}
          <PanelResizeHandle 
            className="w-1.5 bg-gray-200 hover:bg-blue-500 transition-colors dark:bg-gray-700 dark:hover:bg-blue-600" 
          />
          
          {/* Right panel - diff viewer */}
          <Panel id="diff" defaultSize={60} minSize={30}>
            <div className="h-full flex flex-col">
              <div className="p-2 border-b border-gray-200 dark:border-gray-700 text-sm flex justify-between items-center">
                {selectedFile ? (
                  <span className="font-medium">Diff</span>
                ) : (
                  <span className="text-gray-500">Select a file to view diff</span>
                )}
                
                {selectedFile && selectedCommit && (
                  <button
                    onClick={() => handleRevertFile(selectedCommit, selectedFile)}
                    disabled={isReverting}
                    className={`text-xs px-2 py-1 rounded flex items-center ${
                      isReverting
                        ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800'
                    }`}
                  >
                    <ArrowUturnLeftIcon className="w-3 h-3 mr-1" />
                    Revert File
                  </button>
                )}
              </div>
              
              <div className="flex-1 overflow-hidden">
                {renderDiffViewer()}
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
} 