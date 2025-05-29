'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowUpIcon, ArrowDownIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';

interface ShellCommand {
  command: string;
  output: string;
  timestamp: Date;
  status: 'success' | 'error' | 'running';
}

interface ShellPanelProps {
  projectId: string;
}

export default function ShellPanel({ projectId }: ShellPanelProps) {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<ShellCommand[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const shellOutputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial message
  useEffect(() => {
    setHistory([
      {
        command: '',
        output: `Welcome to the project shell.\nType 'help' to see available commands.`,
        timestamp: new Date(),
        status: 'success'
      }
    ]);
  }, []);

  // Scroll to bottom when history changes
  useEffect(() => {
    if (shellOutputRef.current) {
      shellOutputRef.current.scrollTop = shellOutputRef.current.scrollHeight;
    }
  }, [history]);

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const executeCommand = async (cmd: string) => {
    if (!cmd.trim()) return;

    setIsExecuting(true);
    
    // Add command to history immediately
    setHistory(prev => [
      ...prev,
      {
        command: cmd,
        output: 'Executing...',
        timestamp: new Date(),
        status: 'running'
      }
    ]);

    try {
      let output = '';
      let status: 'success' | 'error' = 'success';

      // Handle built-in commands
      if (cmd === 'clear') {
        setHistory([]);
        setIsExecuting(false);
        return;
      } else if (cmd === 'help') {
        output = `Available commands:
  help - Show this help message
  clear - Clear the shell output
  ls - List files (not yet implemented)
  cd <dir> - Change directory (not yet implemented)
  git status - Show git status (not yet implemented)
  npm <command> - Run npm commands (not yet implemented)

Future updates will include actual command execution.`;
      } else {
        // Simulate sending the command to the server
        // In the future, this would make an API call to execute the command
        output = `Command '${cmd}' execution is simulated.\nActual command execution will be implemented in a future update.`;
      }

      // Update history with the result
      setHistory(prev => 
        prev.map((item, index) => 
          index === prev.length - 1 
            ? { ...item, output, status } 
            : item
        )
      );
    } catch (error) {
      // Update history with error
      setHistory(prev => 
        prev.map((item, index) => 
          index === prev.length - 1 
            ? { 
                ...item, 
                output: `Error executing command: ${error instanceof Error ? error.message : 'Unknown error'}`, 
                status: 'error' 
              } 
            : item
        )
      );
    } finally {
      setIsExecuting(false);
      setCommand('');
      setHistoryIndex(-1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isExecuting) return;
    executeCommand(command);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle up/down arrow keys for command history navigation
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      
      // Find previous command (skip outputs without commands)
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        // Find the command at this index
        const prevCommand = history[history.length - 1 - newIndex]?.command || '';
        setCommand(prevCommand);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        const nextCommand = history[history.length - 1 - newIndex]?.command || '';
        setCommand(nextCommand);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100">
      {/* Shell header */}
      <div className="flex justify-between items-center p-2 border-b border-gray-700 bg-gray-800">
        <h3 className="text-sm font-medium text-gray-200">Project Shell</h3>
        <button 
          onClick={clearHistory}
          className="text-gray-400 hover:text-gray-200"
          title="Clear shell history"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Shell output */}
      <div 
        ref={shellOutputRef}
        className="flex-1 overflow-auto p-2 font-mono text-sm"
      >
        {history.map((item, index) => (
          <div key={index} className="mb-3">
            {item.command && (
              <div className="flex items-start">
                <span className="text-green-500 mr-2">$</span>
                <span className="text-gray-200">{item.command}</span>
              </div>
            )}
            <div className={`ml-4 whitespace-pre-wrap ${
              item.status === 'error' 
                ? 'text-red-400' 
                : item.status === 'running' 
                  ? 'text-yellow-400' 
                  : 'text-gray-400'
            }`}>
              {item.output}
            </div>
          </div>
        ))}
      </div>

      {/* Command input */}
      <form onSubmit={handleSubmit} className="p-2 border-t border-gray-700 bg-gray-800">
        <div className="flex items-center">
          <span className="text-green-500 mr-2">$</span>
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isExecuting}
            placeholder="Type command here..."
            className="flex-1 bg-transparent border-none text-gray-200 focus:outline-none font-mono"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
          {command && (
            <button
              type="button"
              onClick={() => setCommand('')}
              className="text-gray-500 hover:text-gray-300"
              title="Clear input"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <div className="flex items-center">
            <ArrowUpIcon className="w-3 h-3 mr-1" />
            <ArrowDownIcon className="w-3 h-3 mr-1" />
            <span>Navigate history</span>
          </div>
          <div>Press Enter to execute</div>
        </div>
      </form>
    </div>
  );
} 