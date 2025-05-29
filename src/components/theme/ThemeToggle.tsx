'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get the current theme icon
  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <SunIcon className="w-5 h-5 text-yellow-500" />;
      case 'dark':
        return <MoonIcon className="w-5 h-5 text-blue-400" />;
      case 'system':
        return <ComputerDesktopIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />;
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle theme"
      >
        {getThemeIcon()}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 py-2">
          <button
            className={`w-full text-left px-4 py-2 flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-gray-700/50 ${
              theme === 'light' ? 'bg-gray-100 dark:bg-gray-700/50' : ''
            }`}
            onClick={() => {
              setTheme('light');
              setIsOpen(false);
            }}
          >
            <SunIcon className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Light</span>
          </button>
          
          <button
            className={`w-full text-left px-4 py-2 flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-gray-700/50 ${
              theme === 'dark' ? 'bg-gray-100 dark:bg-gray-700/50' : ''
            }`}
            onClick={() => {
              setTheme('dark');
              setIsOpen(false);
            }}
          >
            <MoonIcon className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Dark</span>
          </button>
          
          <button
            className={`w-full text-left px-4 py-2 flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-gray-700/50 ${
              theme === 'system' ? 'bg-gray-100 dark:bg-gray-700/50' : ''
            }`}
            onClick={() => {
              setTheme('system');
              setIsOpen(false);
            }}
          >
            <ComputerDesktopIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">System</span>
          </button>
        </div>
      )}
    </div>
  );
} 