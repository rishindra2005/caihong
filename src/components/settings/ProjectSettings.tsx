'use client';

import { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { 
  CodeBracketIcon, 
  FolderIcon, 
  CodeBracketSquareIcon, 
  AdjustmentsHorizontalIcon 
} from '@heroicons/react/24/outline';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useRouter } from 'next/navigation';

// Define the ProjectSettings type to be used throughout the application
export interface ProjectSettings {
  editorTheme: 'light' | 'dark' | 'system';
  syncWithGlobalTheme: boolean; // New property to sync with global theme
  horizontalScroll: boolean;
  fontSize: number;
  tabSize: number;
  editorType: 'monaco' | 'codemirror'; // Add editorType property to choose between editors
  latexCompiler: 'pdflatex' | 'xelatex' | 'lualatex';
  latexCompilerFlags: string[]; // New field for compiler flags
  wordWrap: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
  showMinimap: boolean;
  gitEnabled: boolean;
  autoCommitAfterInactivity: number; // In milliseconds
  // Settings for file explorer
  hideDotFiles: boolean; // Hide files and folders that start with a dot
  hideFileExtensions: string[]; // Array of file extensions to hide (without the dot)
}

// Default settings
export const defaultSettings: ProjectSettings = {
  editorTheme: 'system',
  syncWithGlobalTheme: true, // Default to sync with global theme
  horizontalScroll: false,
  fontSize: 14,
  tabSize: 2,
  editorType: 'monaco', // Default to Monaco editor
  latexCompiler: 'pdflatex',
  latexCompilerFlags: ['-interaction=nonstopmode', '-file-line-error'],  // Default flags
  wordWrap: 'on',
  showMinimap: true,
  gitEnabled: true,
  autoCommitAfterInactivity: 60000, // 1 minute in milliseconds
  // Default values for new settings - updated to hide dot files and LaTeX auxiliary files
  hideDotFiles: true,
  hideFileExtensions: [
    // LaTeX auxiliary files
    'aux', 'log', 'out', 'toc', 'lof', 'lot', 'bbl', 'blg', 'synctex.gz', 'fls', 'fdb_latexmk',
    // Other common auxiliary files
    'bak', 'tmp', 'temp', 'cache'
  ]
};

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ProjectSettings;
  onSave: (settings: ProjectSettings) => Promise<void>;
  projectId?: string; // Add projectId as an optional prop
}

const classNames = (...classes: string[]) => {
  return classes.filter(Boolean).join(' ');
};

export default function ProjectSettingsModal({ 
  isOpen, 
  onClose, 
  settings,
  onSave,
  projectId
}: ProjectSettingsModalProps) {
  const { theme: globalTheme } = useTheme();
  const router = useRouter();
  
  // Create a deep copy of settings with default values for any missing properties
  const [editedSettings, setEditedSettings] = useState<ProjectSettings>({
    ...defaultSettings, // Start with all defaults
    ...settings, // Override with any provided settings
  });
  const [isSaving, setIsSaving] = useState(false);
  const [extensionInput, setExtensionInput] = useState('');
  const [customFlagInput, setCustomFlagInput] = useState('');
  const [isTestingCredits, setIsTestingCredits] = useState(false);
  const [creditTestStatus, setCreditTestStatus] = useState<string | null>(null);
  
  // Reset edited settings when modal opens or settings change
  useEffect(() => {
    if (isOpen) {
      setEditedSettings({
        ...defaultSettings, // Start with defaults to ensure all properties exist
        ...settings, // Override with current settings
      });
      setExtensionInput('');
      setCustomFlagInput('');
    }
  }, [isOpen, settings]);
  
  // Add effect to sync editor theme with global theme when syncWithGlobalTheme is true
  useEffect(() => {
    if (editedSettings.syncWithGlobalTheme) {
      setEditedSettings(prev => ({
        ...prev,
        editorTheme: globalTheme as 'light' | 'dark' | 'system'
      }));
    }
  }, [globalTheme, editedSettings.syncWithGlobalTheme]);
  
  // Handle save settings
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editedSettings);
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle adding a file extension to hide
  const handleAddExtension = () => {
    // Remove leading dot if present and trim whitespace
    const ext = extensionInput.trim().replace(/^\./, '');
    
    if (ext && !editedSettings.hideFileExtensions.includes(ext)) {
      setEditedSettings({
        ...editedSettings,
        hideFileExtensions: [...editedSettings.hideFileExtensions, ext]
      });
      setExtensionInput('');
    }
  };

  // Handle removing a file extension from the list
  const handleRemoveExtension = (ext: string) => {
    setEditedSettings({
      ...editedSettings,
      hideFileExtensions: editedSettings.hideFileExtensions.filter(e => e !== ext)
    });
  };

  // Handle credit subtraction test
  const handleTestCreditSubtraction = async () => {
    setIsTestingCredits(true);
    setCreditTestStatus(null);
    
    try {
      const response = await fetch('/api/credits/subtract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 5, // Subtract 5 credits
          description: 'test', // Description as requested
          action: 'test', // Action as requested
          projectId: projectId // Include the projectId if available
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setCreditTestStatus(`Success! Subtracted 5 credits. New balance: ${data.credits}`);
        // Refresh to show the updated credit count
        router.refresh();
      } else {
        setCreditTestStatus(`Error: ${data.error}${data.details ? ` (${data.details})` : ''}`);
      }
    } catch (error) {
      setCreditTestStatus(`Failed to subtract credits: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTestingCredits(false);
    }
  };

  // Custom flag handler
  const handleAddCustomFlag = () => {
    if (customFlagInput && customFlagInput.trim()) {
      // Make sure it starts with a dash
      let flag = customFlagInput.trim();
      if (!flag.startsWith('-')) {
        flag = `-${flag}`;
      }
      
      // Add the flag if it's not already present
      if (!editedSettings.latexCompilerFlags.includes(flag)) {
        setEditedSettings({
          ...editedSettings,
          latexCompilerFlags: [...editedSettings.latexCompilerFlags, flag]
        });
      }
      
      // Clear the input
      setCustomFlagInput('');
    }
  };
  
  if (!isOpen) return null;

  // Define the tab categories
  const categories = [
    { name: 'Editor', icon: <CodeBracketIcon className="w-5 h-5" /> },
    { name: 'Compile', icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
    { name: 'Files', icon: <FolderIcon className="w-5 h-5" /> },
    { name: 'Git', icon: <CodeBracketSquareIcon className="w-5 h-5" /> },
    { name: 'Other', icon: <AdjustmentsHorizontalIcon className="w-5 h-5" /> },
  ];
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-3xl overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-medium">Project Settings</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          <Tab.Group>
            <Tab.List className="flex space-x-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4">
              {categories.map((category) => (
                <Tab
                  key={category.name}
                  className={({ selected }) =>
                    classNames(
                      'w-full py-2.5 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center',
                      selected
                        ? 'bg-white dark:bg-gray-800 shadow text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )
                  }
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.name}
                </Tab>
              ))}
            </Tab.List>
            <Tab.Panels>
              {/* Editor Settings Panel */}
              <Tab.Panel className="space-y-6 p-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Editor Type Selection */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-3">Editor Type</label>
                    <div className="flex space-x-6">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="editorType"
                          value="monaco"
                          checked={editedSettings.editorType === 'monaco'}
                          onChange={() => setEditedSettings({...editedSettings, editorType: 'monaco'})}
                          className="form-radio h-4 w-4 text-blue-600 dark:text-blue-400"
                        />
                        <span className="ml-2 text-gray-700 dark:text-gray-300">
                          Monaco Editor
                          <span className="text-xs ml-2 text-gray-500 dark:text-gray-400">(VS Code-based, feature-rich)</span>
                        </span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="editorType"
                          value="codemirror"
                          checked={editedSettings.editorType === 'codemirror'}
                          onChange={() => setEditedSettings({...editedSettings, editorType: 'codemirror'})}
                          className="form-radio h-4 w-4 text-blue-600 dark:text-blue-400"
                        />
                        <span className="ml-2 text-gray-700 dark:text-gray-300">
                          CodeMirror
                          <span className="text-xs ml-2 text-gray-500 dark:text-gray-400">(Lightweight, customizable)</span>
                        </span>
                      </label>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Note: Changing editors will require a file reload to take effect fully.
                    </p>
                  </div>
                
                  {/* Editor Theme */}
                  <div className="col-span-1">
                    <label className="block text-sm font-medium mb-2">Editor Theme</label>
                    <select
                      value={editedSettings.editorTheme}
                      onChange={(e) => setEditedSettings({...editedSettings, editorTheme: e.target.value as 'light' | 'dark' | 'system', syncWithGlobalTheme: false})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white"
                      disabled={editedSettings.syncWithGlobalTheme}
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System Default</option>
                    </select>
                    <div className="mt-2">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={editedSettings.syncWithGlobalTheme}
                          onChange={(e) => setEditedSettings({...editedSettings, syncWithGlobalTheme: e.target.checked, editorTheme: e.target.checked ? globalTheme as 'light' | 'dark' | 'system' : editedSettings.editorTheme})}
                          className="form-checkbox h-4 w-4 text-blue-600 dark:text-blue-400"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Sync with global theme</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Word Wrap */}
                  <div className="col-span-1">
                    <label className="block text-sm font-medium mb-2">Word Wrap</label>
                    <select
                      value={editedSettings.wordWrap}
                      onChange={(e) => setEditedSettings({...editedSettings, wordWrap: e.target.value as 'on' | 'off' | 'wordWrapColumn' | 'bounded'})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700"
                    >
                      <option value="on">On</option>
                      <option value="off">Off</option>
                      <option value="wordWrapColumn">Word Wrap Column</option>
                      <option value="bounded">Bounded</option>
                    </select>
                  </div>
                  
                  {/* Font Size */}
                  <div className="col-span-1">
                    <label className="block text-sm font-medium mb-2">Font Size ({editedSettings.fontSize}px)</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="10"
                        max="24"
                        value={editedSettings.fontSize}
                        onChange={(e) => setEditedSettings({...editedSettings, fontSize: parseInt(e.target.value)})}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  {/* Tab Size */}
                  <div className="col-span-1">
                    <label className="block text-sm font-medium mb-2">Tab Size ({editedSettings.tabSize} spaces)</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="2"
                        max="8"
                        step="2"
                        value={editedSettings.tabSize}
                        onChange={(e) => setEditedSettings({...editedSettings, tabSize: parseInt(e.target.value)})}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Checkboxes for editor features */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="showMinimap"
                      checked={editedSettings.showMinimap}
                      onChange={(e) => setEditedSettings({...editedSettings, showMinimap: e.target.checked})}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600"
                    />
                    <label htmlFor="showMinimap" className="text-sm font-medium">Show Minimap</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="horizontalScroll"
                      checked={editedSettings.horizontalScroll}
                      onChange={(e) => setEditedSettings({...editedSettings, horizontalScroll: e.target.checked})}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600"
                    />
                    <label htmlFor="horizontalScroll" className="text-sm font-medium">Enable Horizontal Scroll</label>
                  </div>
                </div>
              </Tab.Panel>
              
              {/* Compile Settings Panel */}
              <Tab.Panel className="space-y-6 p-2">
                <div className="grid grid-cols-1 gap-6">
                  {/* LaTeX Compiler Selection */}
                  <div className="col-span-1">
                    <label className="block text-sm font-medium mb-2">LaTeX Compiler</label>
                    <select
                      value={editedSettings.latexCompiler}
                      onChange={(e) => setEditedSettings({...editedSettings, latexCompiler: e.target.value as 'pdflatex' | 'xelatex' | 'lualatex'})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white"
                    >
                      <option value="pdflatex">pdfLaTeX</option>
                      <option value="xelatex">XeLaTeX</option>
                      <option value="lualatex">LuaLaTeX</option>
                    </select>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Select which LaTeX compiler to use for document compilation.
                    </p>
                  </div>

                  {/* LaTeX Compiler Flags */}
                  <div className="col-span-1">
                    <label className="block text-sm font-medium mb-2">LaTeX Compiler Flags</label>
                    <div className="space-y-3">
                      {/* Common flags as checkboxes for easier configuration */}
                      <div className="flex flex-col space-y-2">
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={editedSettings.latexCompilerFlags.includes('-interaction=nonstopmode')}
                            onChange={(e) => {
                              const newFlags = [...editedSettings.latexCompilerFlags];
                              if (e.target.checked) {
                                if (!newFlags.includes('-interaction=nonstopmode')) {
                                  newFlags.push('-interaction=nonstopmode');
                                }
                              } else {
                                const index = newFlags.indexOf('-interaction=nonstopmode');
                                if (index !== -1) {
                                  newFlags.splice(index, 1);
                                }
                              }
                              setEditedSettings({
                                ...editedSettings,
                                latexCompilerFlags: newFlags
                              });
                            }}
                            className="form-checkbox h-4 w-4 text-blue-600 dark:text-blue-400"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            -interaction=nonstopmode (Run without user interaction)
                          </span>
                        </label>

                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={editedSettings.latexCompilerFlags.includes('-file-line-error')}
                            onChange={(e) => {
                              const newFlags = [...editedSettings.latexCompilerFlags];
                              if (e.target.checked) {
                                if (!newFlags.includes('-file-line-error')) {
                                  newFlags.push('-file-line-error');
                                }
                              } else {
                                const index = newFlags.indexOf('-file-line-error');
                                if (index !== -1) {
                                  newFlags.splice(index, 1);
                                }
                              }
                              setEditedSettings({
                                ...editedSettings,
                                latexCompilerFlags: newFlags
                              });
                            }}
                            className="form-checkbox h-4 w-4 text-blue-600 dark:text-blue-400"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            -file-line-error (Show file and line for errors)
                          </span>
                        </label>

                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={editedSettings.latexCompilerFlags.includes('-shell-escape')}
                            onChange={(e) => {
                              const newFlags = [...editedSettings.latexCompilerFlags];
                              if (e.target.checked) {
                                if (!newFlags.includes('-shell-escape')) {
                                  newFlags.push('-shell-escape');
                                }
                              } else {
                                const index = newFlags.indexOf('-shell-escape');
                                if (index !== -1) {
                                  newFlags.splice(index, 1);
                                }
                              }
                              setEditedSettings({
                                ...editedSettings,
                                latexCompilerFlags: newFlags
                              });
                            }}
                            className="form-checkbox h-4 w-4 text-blue-600 dark:text-blue-400"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            -shell-escape (Allow external commands)
                          </span>
                        </label>

                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={editedSettings.latexCompilerFlags.includes('-synctex=1')}
                            onChange={(e) => {
                              const newFlags = [...editedSettings.latexCompilerFlags];
                              if (e.target.checked) {
                                if (!newFlags.includes('-synctex=1')) {
                                  newFlags.push('-synctex=1');
                                }
                              } else {
                                const index = newFlags.indexOf('-synctex=1');
                                if (index !== -1) {
                                  newFlags.splice(index, 1);
                                }
                              }
                              setEditedSettings({
                                ...editedSettings,
                                latexCompilerFlags: newFlags
                              });
                            }}
                            className="form-checkbox h-4 w-4 text-blue-600 dark:text-blue-400"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            -synctex=1 (Generate SyncTeX data)
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Custom Flags Input */}
                  <div className="col-span-1">
                    <label className="block text-sm font-medium mb-2">Custom Compiler Flag</label>
                    <div className="flex">
                      <input
                        type="text"
                        placeholder="-some-flag=value"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md shadow-sm dark:bg-gray-700 dark:text-white"
                        value={customFlagInput || ''}
                        onChange={(e) => setCustomFlagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddCustomFlag()}
                      />
                      <button
                        onClick={handleAddCustomFlag}
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600"
                      >
                        Add
                      </button>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Add a custom compiler flag (include the leading dash).
                    </p>
                  </div>

                  {/* Display current flags */}
                  <div className="col-span-1">
                    <label className="block text-sm font-medium mb-2">Current Compiler Flags</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {editedSettings.latexCompilerFlags.map((flag, index) => (
                        <div 
                          key={index} 
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                        >
                          {flag}
                          <button
                            type="button"
                            onClick={() => {
                              const newFlags = [...editedSettings.latexCompilerFlags];
                              newFlags.splice(index, 1);
                              setEditedSettings({
                                ...editedSettings,
                                latexCompilerFlags: newFlags
                              });
                            }}
                            className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 hover:text-gray-700 dark:bg-gray-600 dark:text-gray-400 dark:hover:bg-gray-500 dark:hover:text-gray-300"
                          >
                            <span className="sr-only">Remove flag</span>
                            <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                              <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      {editedSettings.latexCompilerFlags.length === 0 && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">No flags configured.</span>
                      )}
                    </div>
                  </div>

                  {/* Sample command display */}
                  <div className="col-span-1 mt-4">
                    <label className="block text-sm font-medium mb-2">Sample Command</label>
                    <div className="mt-1 p-3 bg-gray-100 dark:bg-gray-700 rounded-md overflow-x-auto">
                      <code className="text-sm text-gray-800 dark:text-gray-200 font-mono">
                        {`${editedSettings.latexCompiler} ${editedSettings.latexCompilerFlags.join(' ')} document.tex`}
                      </code>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      This is how your LaTeX compilation command will look like.
                    </p>
                  </div>
                </div>
              </Tab.Panel>
              
              {/* File Explorer Settings Panel */}
              <Tab.Panel className="space-y-6 p-2">
                <h4 className="text-sm font-bold mb-3">File Visibility</h4>
                
                {/* Hide Dot Files */}
                <div className="flex items-center space-x-2 mb-3">
                  <input
                    type="checkbox"
                    id="hideDotFiles"
                    checked={editedSettings.hideDotFiles}
                    onChange={(e) => setEditedSettings({...editedSettings, hideDotFiles: e.target.checked})}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600"
                  />
                  <label htmlFor="hideDotFiles" className="text-sm font-medium">Hide files and folders starting with a dot (.)</label>
                </div>
                
                {/* Hidden File Extensions */}
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-2">Hidden File Extensions</label>
                  <div className="flex mb-2">
                    <input
                      type="text"
                      value={extensionInput}
                      onChange={(e) => setExtensionInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddExtension();
                        }
                      }}
                      placeholder="e.g. tmp, log, cache"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md shadow-sm dark:bg-gray-700"
                    />
                    <button
                      onClick={handleAddExtension}
                      className="px-3 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
                    >
                      Add
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-500 mb-3">
                    Files with these extensions will be hidden in the file explorer.
                  </p>
                  
                  {/* Display current hidden extensions */}
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                    <h5 className="text-sm font-medium mb-2">Currently Hidden Extensions</h5>
                    {editedSettings.hideFileExtensions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {editedSettings.hideFileExtensions.map(ext => (
                          <span 
                            key={ext} 
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-200 dark:bg-gray-600"
                          >
                            .{ext}
                            <button
                              onClick={() => handleRemoveExtension(ext)}
                              className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">No extensions hidden</p>
                    )}
                  </div>
                </div>
              </Tab.Panel>
              
              {/* Git Settings Panel */}
              <Tab.Panel className="space-y-6 p-2">
                <h4 className="text-sm font-bold mb-3">Version Control</h4>
                
                {/* Enable Git */}
                <div className="flex items-center space-x-2 mb-3">
                  <input
                    type="checkbox"
                    id="gitEnabled"
                    checked={editedSettings.gitEnabled}
                    onChange={(e) => setEditedSettings({...editedSettings, gitEnabled: e.target.checked})}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600"
                  />
                  <label htmlFor="gitEnabled" className="text-sm font-medium">Enable Git Version Control</label>
                </div>
                
                {/* Auto-commit timer */}
                <div className={editedSettings.gitEnabled ? '' : 'opacity-50 pointer-events-none'}>
                  <label className="block text-sm font-medium mb-2">
                    Auto-commit after inactivity ({Math.round(editedSettings.autoCommitAfterInactivity / 1000)} seconds)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="30000"
                      max="300000"
                      step="15000"
                      disabled={!editedSettings.gitEnabled}
                      value={editedSettings.autoCommitAfterInactivity}
                      onChange={(e) => setEditedSettings({...editedSettings, autoCommitAfterInactivity: parseInt(e.target.value)})}
                      className="w-full"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Changes will be automatically committed after this period of inactivity
                  </p>
                </div>
              </Tab.Panel>
              
              {/* Other Settings Panel */}
              <Tab.Panel className="space-y-6 p-2">
                <h4 className="text-sm font-bold mb-3">Compilers & Extensions</h4>
                
                {/* Credit API Test Section */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-bold mb-3">API Tests</h4>
                  
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <h5 className="text-sm font-medium mb-2">Credit API Test</h5>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                      Click below to test the credit subtraction API. This will subtract 5 credits from your account.
                    </p>
                    
                    <button
                      onClick={handleTestCreditSubtraction}
                      disabled={isTestingCredits}
                      className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white
                        ${isTestingCredits 
                          ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
                          : 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800'
                        }`}
                    >
                      {isTestingCredits ? 'Processing...' : 'Test -5 Credits'}
                    </button>
                    
                    {creditTestStatus && (
                      <p className={`mt-3 text-sm ${creditTestStatus.includes('Success') 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'}`}
                      >
                        {creditTestStatus}
                      </p>
                    )}
                  </div>
                </div>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white ${
              isSaving 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
} 