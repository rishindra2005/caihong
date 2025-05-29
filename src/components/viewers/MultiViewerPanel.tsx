'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  DocumentIcon, 
  PhotoIcon, 
  CommandLineIcon, 
  ChatBubbleBottomCenterTextIcon,
  AdjustmentsHorizontalIcon,
  ClockIcon,
  CodeBracketIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import PdfViewer from './PdfViewer';
import MediaViewer from './MediaViewer';
import LogsPanel from './LogsPanel';
import HistoryPanel from './HistoryPanel';
import ShellPanel from './ShellPanel';
import TexLogsPanel from './TexLogsPanel';

interface MultiViewerPanelProps {
  activeTab: 'pdf' | 'media' | 'logs' | 'ai' | 'history' | 'shell' | 'texlogs';
  onTabChange: (tab: 'pdf' | 'media' | 'logs' | 'ai' | 'history' | 'shell' | 'texlogs') => void;
  viewerContent: {
    url: string;
    type: string;
    title: string;
  } | null;
  logMessages: {
    type: 'info' | 'error' | 'warning';
    message: string;
    timestamp: Date;
  }[];
  pdfViewerType: 'internal' | 'browser';
  onTogglePdfViewerType: () => void;
  projectId: string;
  selectedFile: string | null;
  onRefreshFileExplorer?: () => void;
  refreshTrigger?: number;
}

export default function MultiViewerPanel({
  activeTab,
  onTabChange,
  viewerContent,
  logMessages,
  pdfViewerType,
  onTogglePdfViewerType,
  projectId,
  selectedFile,
  onRefreshFileExplorer,
  refreshTrigger = 0
}: MultiViewerPanelProps) {
  const [contentKey, setContentKey] = useState<number>(0);
  
  const refreshViewer = useCallback(() => {
    setContentKey(prev => prev + 1);
  }, []);
  
  useEffect(() => {
    if (refreshTrigger > 0) {
      refreshViewer();
    }
  }, [refreshTrigger, refreshViewer]);
  
  useEffect(() => {
    if (viewerContent?.url) {
      refreshViewer();
    }
  }, [viewerContent?.url, refreshViewer]);

  return (
    <div className="w-full h-full flex flex-col border-l border-gray-200 dark:border-gray-700">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <button
          onClick={() => onTabChange('pdf')}
          className={`flex items-center justify-center py-2 text-sm font-medium ${
            activeTab === 'pdf'
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          } px-3 whitespace-nowrap`}
        >
          <DocumentIcon className="w-4 h-4 mr-1" />
          PDF
        </button>
        <button
          onClick={() => onTabChange('texlogs')}
          className={`flex items-center justify-center py-2 text-sm font-medium ${
            activeTab === 'texlogs'
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          } px-3 whitespace-nowrap`}
        >
          <DocumentTextIcon className="w-4 h-4 mr-1" />
          TeX Logs
        </button>
        <button
          onClick={() => onTabChange('media')}
          className={`flex items-center justify-center py-2 text-sm font-medium ${
            activeTab === 'media'
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          } px-3 whitespace-nowrap`}
        >
          <PhotoIcon className="w-4 h-4 mr-1" />
          Media
        </button>
        <button
          onClick={() => onTabChange('logs')}
          className={`flex items-center justify-center py-2 text-sm font-medium ${
            activeTab === 'logs'
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          } px-3 whitespace-nowrap`}
        >
          <CommandLineIcon className="w-4 h-4 mr-1" />
          Logs
        </button>
        <button
          onClick={() => onTabChange('shell')}
          className={`flex items-center justify-center py-2 text-sm font-medium ${
            activeTab === 'shell'
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          } px-3 whitespace-nowrap`}
        >
          <CodeBracketIcon className="w-4 h-4 mr-1" />
          Shell
        </button>
        <button
          onClick={() => onTabChange('history')}
          className={`flex items-center justify-center py-2 text-sm font-medium ${
            activeTab === 'history'
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          } px-3 whitespace-nowrap`}
        >
          <ClockIcon className="w-4 h-4 mr-1" />
          History
        </button>
        <button
          onClick={() => onTabChange('ai')}
          className={`flex items-center justify-center py-2 text-sm font-medium ${
            activeTab === 'ai'
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          } px-3 whitespace-nowrap`}
        >
          <ChatBubbleBottomCenterTextIcon className="w-4 h-4 mr-1" />
          AI
        </button>
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 overflow-auto">
        {/* PDF Viewer */}
        {activeTab === 'pdf' && (
          <div className="h-full flex flex-col">
            <div className="p-2 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium truncate">
                {viewerContent?.title || 'PDF Viewer'}
              </h3>
              <div className="flex items-center">
                {/* Compilation Logs Button */}
                <button
                  onClick={() => onTabChange('texlogs')}
                  className="mr-3 px-2 py-1 text-xs bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md flex items-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  title="View compilation logs"
                >
                  <DocumentTextIcon className="w-3.5 h-3.5 mr-1" />
                  <span>TeX Logs</span>
                </button>
                <span className="text-xs text-gray-500 mr-2">
                  Using Browser PDF Viewer
                </span>
              </div>
            </div>
            {viewerContent?.type === 'pdf' ? (
              <PdfViewer 
                key={`pdf-${contentKey}-${viewerContent.url}`}
                url={viewerContent.url} 
                title={viewerContent.title} 
                viewerType={pdfViewerType}
                hideHeader={true}
                onViewTexLogs={() => onTabChange('texlogs')}
                showTexLogsButton={true}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 p-4 text-center">
                <div>
                  <DocumentIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No PDF file opened</p>
                  <p className="text-xs mt-2">Open a PDF file from the file explorer</p>
                  {pdfViewerType === 'browser' && (
                    <p className="text-xs mt-4 text-blue-500">
                      Note: PDFs will use browser's built-in viewer when in Browser mode
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TeX Logs */}
        {activeTab === 'texlogs' && (
          <TexLogsPanel 
            key={`texlogs-${contentKey}-${selectedFile}`}
            projectId={projectId}
            filePath={selectedFile}
            onRefreshRequest={onRefreshFileExplorer}
          />
        )}

        {/* Media Viewer */}
        {activeTab === 'media' && (
          <div className="h-full flex flex-col">
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium truncate">
                {viewerContent?.title || 'Media Viewer'}
              </h3>
            </div>
            {viewerContent && ['image', 'video', 'audio'].includes(viewerContent.type) ? (
              <MediaViewer 
                key={`media-${contentKey}-${viewerContent.url}`} 
                url={viewerContent.url} 
                title={viewerContent.title} 
                type={viewerContent.type as 'image' | 'video' | 'audio'} 
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 p-4 text-center">
                <div>
                  <PhotoIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No media file opened</p>
                  <p className="text-xs mt-2">Open an image, video, or audio file from the file explorer</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Logs Panel */}
        {activeTab === 'logs' && (
          <LogsPanel key={`logs-${contentKey}`} messages={logMessages} />
        )}

        {/* Shell Panel */}
        {activeTab === 'shell' && (
          <ShellPanel projectId={projectId} />
        )}

        {/* History Panel */}
        {activeTab === 'history' && (
          <HistoryPanel projectId={projectId} />
        )}

        {/* AI Chat (Coming Soon) */}
        {activeTab === 'ai' && (
          <div className="flex items-center justify-center h-full text-gray-500 p-4 text-center">
            <div>
              <ChatBubbleBottomCenterTextIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="font-medium">AI Chat</p>
              <p className="text-xs mt-2">Coming soon</p>
              <p className="text-xs mt-4 max-w-xs">
                AI-powered LaTeX assistance will be available in a future update. 
                Stay tuned for intelligent code completion and formula generation.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 