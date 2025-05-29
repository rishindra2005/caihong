'use client';

import { useState, useEffect, useCallback } from 'react';
import { DocumentTextIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { ParsedLatexLog, FileReference } from '@/lib/utils/latexLogParser';

interface TexLogsPanelProps {
  projectId: string;
  filePath: string | null;
  onRefreshRequest?: () => void;
}

export default function TexLogsPanel({ projectId, filePath, onRefreshRequest }: TexLogsPanelProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rawLogs, setRawLogs] = useState<string | null>(null);
  const [parsedLogs, setParsedLogs] = useState<ParsedLatexLog | null>(null);
  const [activeTab, setActiveTab] = useState<'parsed' | 'raw'>('parsed');
  
  // Define fetchLogs as a useCallback function so it can be used in useEffect
  const fetchLogs = useCallback(async () => {
    if (!filePath || !projectId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Preserve the full relative path, including any subfolder structure
      // while ensuring we don't pass the project ID if it's prefixed
      let relativePath = filePath;
      
      // If the path starts with the project ID, remove it
      if (relativePath.startsWith(projectId + '/')) {
        relativePath = relativePath.substring(projectId.length + 1);
      }
      
      console.log("Fetching logs for:", { projectId, filePath: relativePath });
      
      const response = await fetch('/api/compile/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filePath: relativePath,
          projectId
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setRawLogs(data.logContents);
        setParsedLogs(data.parsed);
      } else {
        setError(data.error || 'Failed to fetch LaTeX logs');
        console.error("Log fetch error:", data);
        // Clear existing data
        setRawLogs(null);
        setParsedLogs(null);
      }
    } catch (err) {
      setError('Error fetching logs: ' + (err instanceof Error ? err.message : 'Unknown error'));
      console.error("Log fetch exception:", err);
      setRawLogs(null);
      setParsedLogs(null);
    } finally {
      setLoading(false);
    }
  }, [filePath, projectId]);
  
  // Fetch logs when filePath changes
  useEffect(() => {
    if (filePath && projectId) {
      fetchLogs();
    }
  }, [filePath, projectId, fetchLogs]);
  
  // Add a listener for the compilation-completed event
  useEffect(() => {
    const handleCompilationCompleted = (event: CustomEvent<{ 
      status: string;
      success: boolean;
      errors: string[];
      pdfPath: string | null;
    }>) => {
      console.log("Compilation completed event received, refreshing logs");
      // Always refresh logs after compilation
      fetchLogs();
    };
    
    window.addEventListener('compilation-completed', handleCompilationCompleted as EventListener);
    
    return () => {
      window.removeEventListener('compilation-completed', handleCompilationCompleted as EventListener);
    };
  }, [fetchLogs]);
  
  // Add a listener for the tex-logs-updated event
  useEffect(() => {
    const handleLogsUpdated = (event: CustomEvent<{ projectId: string, filePath: string }>) => {
      // If this is our project and file, refresh logs
      if (event.detail.projectId === projectId && 
          (event.detail.filePath === filePath || 
           event.detail.filePath.endsWith('/' + filePath) || 
           filePath?.endsWith('/' + event.detail.filePath))) {
        console.log("Received logs-updated event, refreshing logs");
        fetchLogs();
      }
    };
    
    window.addEventListener('tex-logs-updated', handleLogsUpdated as EventListener);
    
    return () => {
      window.removeEventListener('tex-logs-updated', handleLogsUpdated as EventListener);
    };
  }, [projectId, filePath, fetchLogs]);
  
  const handleRefresh = () => {
    fetchLogs();
    if (onRefreshRequest) {
      onRefreshRequest();
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-2">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('parsed')}
            className={`px-3 py-1 text-sm rounded-md ${
              activeTab === 'parsed' 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Parsed Logs
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`px-3 py-1 text-sm rounded-md ${
              activeTab === 'raw' 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Raw Log
          </button>
        </div>
        <button
          onClick={handleRefresh}
          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          disabled={loading}
          title="Refresh logs"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
      
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500 dark:text-red-400">
            <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-2" />
            <p>{error}</p>
            <button 
              onClick={handleRefresh}
              className="mt-4 px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Try Again
            </button>
          </div>
        ) : !rawLogs && !parsedLogs ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4 text-center">
            <DocumentTextIcon className="w-12 h-12 mb-2 text-gray-400" />
            <p className="mb-1">No LaTeX logs available</p>
            <p className="text-sm">
              {filePath 
                ? 'Compile your document to generate logs' 
                : 'Select a .tex file to view its compilation logs'}
            </p>
          </div>
        ) : activeTab === 'parsed' ? (
          <div className="p-4">
            {parsedLogs && (
              <>
                {/* Status Banner */}
                <div className={`mb-4 p-3 rounded-md ${
                  parsedLogs.status === 'success' 
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' 
                    : parsedLogs.status === 'partial'
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300'
                      : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                }`}>
                  <div className="flex items-center mb-1">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      parsedLogs.status === 'success'
                        ? 'bg-green-500' 
                        : parsedLogs.status === 'partial'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}></div>
                    <h3 className="text-sm font-medium">
                      {parsedLogs.statusText}
                    </h3>
                  </div>
                  
                  {/* Additional compilation details */}
                  {parsedLogs.compilerInfo && (
                    <div className="text-xs mt-1 pl-6 opacity-80">
                      Compiled with {parsedLogs.compilerInfo}
                      {parsedLogs.compilationTime > 0 && (
                        <span> in {parsedLogs.compilationTime.toFixed(2)}s</span>
                      )}
                    </div>
                  )}
                  
                  {/* Rerun notice if needed */}
                  {parsedLogs.needsRerun && (
                    <div className="mt-2 pl-6 text-xs flex items-center">
                      <InformationCircleIcon className="w-4 h-4 mr-1" />
                      <span>LaTeX needs to be run again to resolve references</span>
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <h3 className="text-sm font-medium mb-2">Compilation Summary</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Pages:</span>{' '}
                      <span>{parsedLogs.pageCount || 'None'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Errors:</span>{' '}
                      <span className={parsedLogs.errors.length > 0 ? 'text-red-600 dark:text-red-400' : ''}>
                        {parsedLogs.errors.length}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Warnings:</span>{' '}
                      <span className={parsedLogs.warnings.length > 0 ? 'text-yellow-600 dark:text-yellow-400' : ''}>
                        {parsedLogs.warnings.length}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Bad Boxes:</span>{' '}
                      <span>{parsedLogs.badBoxes.length}</span>
                    </div>
                  </div>
                </div>
                
                {/* File References */}
                {parsedLogs.fileReferences && parsedLogs.fileReferences.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium border-b border-gray-200 dark:border-gray-700 pb-1 mb-2">
                      Referenced Files
                    </h3>
                    <ul className="space-y-1 text-sm">
                      {Array.from(new Set(parsedLogs.fileReferences.map(ref => ref.file))).slice(0, 10).map((file, i) => (
                        <li key={i} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                          <span className="font-mono">{file}</span>
                        </li>
                      ))}
                      {parsedLogs.fileReferences.length > 10 && (
                        <li className="text-xs text-gray-500 dark:text-gray-400 pl-2">
                          ... and more files referenced
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Errors */}
                {parsedLogs.errors.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium border-b border-red-200 dark:border-red-800 pb-1 mb-2 text-red-600 dark:text-red-400">
                      Errors ({parsedLogs.errors.length})
                    </h3>
                    <ul className="space-y-1 text-sm">
                      {parsedLogs.errors.map((error, i) => (
                        <li key={i} className="p-2 bg-red-50 dark:bg-red-900/20 rounded text-red-800 dark:text-red-300">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warnings */}
                {parsedLogs.warnings.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium border-b border-yellow-200 dark:border-yellow-800 pb-1 mb-2 text-yellow-600 dark:text-yellow-400">
                      Warnings ({parsedLogs.warnings.length})
                    </h3>
                    <ul className="space-y-1 text-sm">
                      {parsedLogs.warnings.map((warning, i) => (
                        <li key={i} className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-yellow-800 dark:text-yellow-300">
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Bad Boxes */}
                {parsedLogs.badBoxes.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium border-b border-gray-200 dark:border-gray-700 pb-1 mb-2">
                      Bad Boxes ({parsedLogs.badBoxes.length})
                    </h3>
                    <ul className="space-y-1 text-sm">
                      {parsedLogs.badBoxes.slice(0, 5).map((box, i) => (
                        <li key={i} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs font-mono">
                          {box}
                        </li>
                      ))}
                      {parsedLogs.badBoxes.length > 5 && (
                        <li className="text-xs text-gray-500 dark:text-gray-400 pl-2">
                          ... and {parsedLogs.badBoxes.length - 5} more
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          // Raw logs tab
          <div className="p-4">
            <pre className="whitespace-pre-wrap font-mono text-xs overflow-x-auto bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
              {rawLogs}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 