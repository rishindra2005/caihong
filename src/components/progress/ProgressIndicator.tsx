import { useState, useEffect } from 'react';
import { XMarkIcon, ArrowsPointingInIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';

export interface ProgressOperation {
  id: string;
  type: 'upload' | 'download' | 'compression' | 'extraction' | 'processing' | 'other';
  name: string;
  progress: number;
  size?: number;
  status: 'pending' | 'active' | 'completed' | 'error';
  message?: string;
  createdAt: Date;
}

interface ProgressIndicatorProps {
  operations: ProgressOperation[];
  onClose: (id: string) => void;
}

export default function ProgressIndicator({ operations, onClose }: ProgressIndicatorProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const activeOperations = operations.filter(op => op.status === 'active' || op.status === 'pending');
  const hasActiveOperations = activeOperations.length > 0;

  // Auto-hide the indicator when there are no active operations for 3 seconds
  useEffect(() => {
    if (!hasActiveOperations && isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
    
    // Show the indicator when there are operations
    if (hasActiveOperations && !isVisible) {
      setIsVisible(true);
    }
  }, [hasActiveOperations, isVisible]);

  if (!isVisible && !hasActiveOperations) {
    return null;
  }

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getOperationIcon = (type: ProgressOperation['type']) => {
    switch (type) {
      case 'upload':
        return '⬆️';
      case 'download':
        return '⬇️';
      case 'compression':
        return '🗜️';
      case 'extraction':
        return '📦';
      case 'processing':
        return '⚙️';
      default:
        return '🔄';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button Always Visible */}
      <div className="flex justify-end mb-2">
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-lg"
          title={isVisible ? "Hide progress" : "Show progress"}
        >
          {activeOperations.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeOperations.length}
            </span>
          )}
          <span className="text-xs">
            {isVisible ? '🔄' : '🔄'}
          </span>
        </button>
      </div>

      {/* Progress Indicator Panel */}
      {isVisible && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden transition-all duration-300 ease-in-out max-w-sm">
          <div className="p-3 bg-gray-50 dark:bg-gray-700 flex justify-between items-center border-b border-gray-200 dark:border-gray-600">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Operations Progress</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? (
                  <ArrowsPointingOutIcon className="w-4 h-4" />
                ) : (
                  <ArrowsPointingInIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          
          {!isMinimized && (
            <div className="p-3 max-h-60 overflow-y-auto">
              {operations.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                  No active operations
                </p>
              ) : (
                <div className="space-y-3">
                  {operations.map((operation) => (
                    <div 
                      key={operation.id} 
                      className={`border rounded p-2 ${
                        operation.status === 'error' 
                          ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20' 
                          : operation.status === 'completed'
                            ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
                            : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center space-x-2">
                          <span>{getOperationIcon(operation.type)}</span>
                          <span className="text-sm font-medium truncate max-w-[180px]" title={operation.name}>
                            {operation.name}
                          </span>
                        </div>
                        <button
                          onClick={() => onClose(operation.id)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {operation.size && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          {formatSize(operation.size)}
                        </div>
                      )}
                      
                      {operation.message && operation.status === 'error' && (
                        <div className="text-xs text-red-600 dark:text-red-400 mb-1">
                          {operation.message}
                        </div>
                      )}
                      
                      <div className="relative pt-1">
                        <div className="flex mb-1 items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold inline-block text-blue-600 dark:text-blue-400">
                              {operation.status === 'completed' ? 'Completed' : `${Math.round(operation.progress)}%`}
                            </span>
                          </div>
                        </div>
                        <div className="overflow-hidden h-1.5 text-xs flex rounded bg-blue-200 dark:bg-blue-900/30">
                          <div
                            style={{ width: `${operation.status === 'completed' ? 100 : operation.progress}%` }}
                            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-300 ${
                              operation.status === 'error' 
                                ? 'bg-red-500 dark:bg-red-400' 
                                : operation.status === 'completed'
                                  ? 'bg-green-500 dark:bg-green-400'
                                  : 'bg-blue-500 dark:bg-blue-400'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {isMinimized && operations.length > 0 && (
            <div className="p-2 text-xs text-gray-600 dark:text-gray-300">
              {activeOperations.length} active operation(s)
            </div>
          )}
        </div>
      )}
    </div>
  );
} 