'use client';

import { useState, useMemo } from 'react';
import { 
  InformationCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon, 
  TrashIcon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface LogMessage {
  type: 'info' | 'error' | 'warning';
  message: string;
  timestamp: Date;
}

interface LogsPanelProps {
  messages: LogMessage[];
}

export default function LogsPanel({ messages }: LogsPanelProps) {
  const [filter, setFilter] = useState<'all' | 'info' | 'warning' | 'error'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter messages based on selected type filter and search query
  const filteredMessages = useMemo(() => {
    return messages.filter(msg => {
      // First apply type filter
      if (filter !== 'all' && msg.type !== filter) return false;
      
      // Then apply search filter if there's a query
      if (searchQuery.trim() === '') return true;
      
      // Case-insensitive search in message text
      return msg.message.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [messages, filter, searchQuery]);

  // Get counts for each type
  const counts = {
    info: messages.filter(m => m.type === 'info').length,
    warning: messages.filter(m => m.type === 'warning').length,
    error: messages.filter(m => m.type === 'error').length
  };

  // Get icon for message type
  const getIcon = (type: 'info' | 'error' | 'warning') => {
    switch (type) {
      case 'info':
        return <InformationCircleIcon className="w-4 h-4 text-blue-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircleIcon className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-2 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchQuery && (
            <button
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              <XCircleIcon className="h-4 w-4 text-gray-400 hover:text-gray-500" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Controls */}
      <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div className="flex space-x-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-2 py-1 text-xs rounded ${
              filter === 'all'
                ? 'bg-gray-200 dark:bg-gray-700 font-medium'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            All ({messages.length})
          </button>
          <button
            onClick={() => setFilter('info')}
            className={`px-2 py-1 text-xs rounded flex items-center ${
              filter === 'info'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <InformationCircleIcon className="w-3 h-3 mr-1" />
            Info ({counts.info})
          </button>
          <button
            onClick={() => setFilter('warning')}
            className={`px-2 py-1 text-xs rounded flex items-center ${
              filter === 'warning'
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 font-medium'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
            Warnings ({counts.warning})
          </button>
          <button
            onClick={() => setFilter('error')}
            className={`px-2 py-1 text-xs rounded flex items-center ${
              filter === 'error'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-medium'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <XCircleIcon className="w-3 h-3 mr-1" />
            Errors ({counts.error})
          </button>
        </div>
        {searchQuery && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Found {filteredMessages.length} matching logs
          </div>
        )}
      </div>

      {/* Log Messages */}
      <div className="flex-1 overflow-auto">
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4 text-center">
            {searchQuery ? (
              <p>No log messages match your search criteria</p>
            ) : (
              <p>No log messages to display</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-2 text-sm ${
                  msg.type === 'error'
                    ? 'bg-red-50 dark:bg-red-900/10'
                    : msg.type === 'warning'
                    ? 'bg-yellow-50 dark:bg-yellow-900/10'
                    : ''
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-2 mt-0.5">{getIcon(msg.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
                      {searchQuery ? highlightSearchTerms(msg.message, searchQuery) : msg.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {format(msg.timestamp, 'HH:mm:ss')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Function to highlight search terms in the message
function highlightSearchTerms(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  
  return parts.map((part, i) => 
    part.toLowerCase() === query.toLowerCase() 
      ? <span key={i} className="bg-yellow-200 dark:bg-yellow-700">{part}</span> 
      : part
  );
} 