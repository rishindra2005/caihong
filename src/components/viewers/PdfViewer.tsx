'use client';

import { useState } from 'react';
import { 
  DocumentIcon, 
  ArrowTopRightOnSquareIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface PdfViewerProps {
  url: string;
  title: string;
  viewerType?: 'internal' | 'browser';
  hideHeader?: boolean;
  onViewTexLogs?: () => void;
  showTexLogsButton?: boolean;
}

export default function PdfViewer({ 
  url, 
  title, 
  viewerType = 'browser',
  hideHeader = false,
  onViewTexLogs,
  showTexLogsButton = false
}: PdfViewerProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  function openInBrowser() {
    window.open(url, '_blank');
  }

  function downloadPdf() {
    const a = document.createElement('a');
    a.href = url;
    a.download = title || 'document.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // Handle iframe load events
  const handleIframeLoad = () => {
    setLoading(false);
  };

  const handleIframeError = (err: any) => {
    setError(new Error("Failed to load PDF"));
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {!hideHeader && (
        <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium truncate">{title}</h3>
          <div className="flex items-center space-x-2">
            {showTexLogsButton && onViewTexLogs && (
              <button
                onClick={onViewTexLogs}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-xs"
                title="View TeX compilation logs"
              >
                <DocumentTextIcon className="w-4 h-4 mr-1" />
                <span>View Logs</span>
              </button>
            )}
            <button
              onClick={openInBrowser}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Open in new tab"
            >
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            </button>
            <button
              onClick={downloadPdf}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Download PDF"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      <div className="flex-1 h-full w-full relative">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-gray-800 bg-opacity-80 dark:bg-opacity-80 z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Loading PDF...</p>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-gray-800 z-10">
            <div className="text-center p-6 max-w-md">
              <DocumentIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                PDF Viewer Error
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                There was an error loading the PDF file.
              </p>
              <div className="flex justify-center space-x-4">
                <button 
                  onClick={openInBrowser}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <ArrowTopRightOnSquareIcon className="w-4 h-4 mr-2" />
                  Open in Browser
                </button>
                <button 
                  onClick={downloadPdf}
                  className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                  Download
                </button>
              </div>
            </div>
          </div>
        )}
        
        <iframe 
          src={url} 
          className="w-full h-full border-0"
          title={title}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />
      </div>
    </div>
  );
} 