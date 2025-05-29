// CodeMirror editor setup with:
// - LaTeX syntax highlighting
// - Auto-completion
// - File handling

import { useEffect, useRef, useState } from 'react';
import { useAI } from '../ai/AIProvider';
import ToolBar from './ToolBar';
// CodeMirror imports
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import { EditorState, Extension } from '@codemirror/state';
import { indentWithTab, history } from '@codemirror/commands';
import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { bracketMatching, foldGutter, indentOnInput } from '@codemirror/language';
import { autocompletion } from '@codemirror/autocomplete';
// Language imports
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';

// Define our own basic setup to avoid import issues
const createBasicSetup = (options: any) => [
  lineNumbers(),
  history(),
  indentOnInput(),
  syntaxHighlighting(defaultHighlightStyle),
  bracketMatching(),
  autocompletion(),
  foldGutter(),
  EditorState.tabSize.of(options.tabSize || 2),
  keymap.of([indentWithTab])
];

// Define props interface to match MonacoEditor
interface CodeMirrorEditorProps {
  initialValue?: string;
  language?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  onSave?: (content: string) => Promise<void>;
  theme?: string;
  options?: {
    wordWrap?: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
    fontSize?: number;
    tabSize?: number;
    scrollBeyondLastLine?: boolean;
    minimap?: {
      enabled?: boolean;
    };
    [key: string]: any;
  };
}

const CodeMirrorEditor: React.FC<CodeMirrorEditorProps> = ({
  initialValue = '',
  language = 'markdown',
  onChange,
  readOnly = false,
  onSave,
  theme: propTheme,
  options = {}
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const { setFileContext } = useAI();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'disconnected'>('idle');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle system theme changes and prop theme
  useEffect(() => {
    if (propTheme) {
      if (propTheme === 'auto' || propTheme === 'system') {
        // Check if there's an html class for dark mode from our global theme
        const htmlEl = document.documentElement;
        if (htmlEl.classList.contains('dark')) {
          setTheme('dark');
        } else if (htmlEl.classList.contains('light')) {
          setTheme('light');
        } else {
          // Fall back to media query if no class is set
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          const handleChange = (e: MediaQueryListEvent) => {
            setTheme(e.matches ? 'dark' : 'light');
          };
          
          setTheme(mediaQuery.matches ? 'dark' : 'light');
          mediaQuery.addEventListener('change', handleChange);
          return () => mediaQuery.removeEventListener('change', handleChange);
        }
      } else {
        // Use explicitly provided theme
        setTheme(propTheme as 'light' | 'dark');
        return undefined;
      }
    } else {
      // Check if there's an html class for dark mode from our global theme
      const htmlEl = document.documentElement;
      if (htmlEl.classList.contains('dark')) {
        setTheme('dark');
      } else if (htmlEl.classList.contains('light')) {
        setTheme('light');
      } else {
        // Fall back to media query if no class is set
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
          setTheme(e.matches ? 'dark' : 'light');
        };

        setTheme(mediaQuery.matches ? 'dark' : 'light');
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      }
    }

    // Listen for changes to the html class
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const htmlEl = document.documentElement;
          if (htmlEl.classList.contains('dark')) {
            setTheme('dark');
          } else if (htmlEl.classList.contains('light')) {
            setTheme('light');
          }
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, [propTheme]);

  // Initialize CodeMirror
  useEffect(() => {
    if (!editorRef.current) return;

    // Clean up previous instance
    if (editorViewRef.current) {
      editorViewRef.current.destroy();
    }

    // Helper to get the language extension based on language string
    const getLanguageExtension = (lang: string): Extension => {
      switch (lang.toLowerCase()) {
        case 'javascript':
        case 'js':
          return javascript();
        case 'typescript':
        case 'ts':
          return javascript({ typescript: true });
        case 'jsx':
          return javascript({ jsx: true });
        case 'tsx':
          return javascript({ jsx: true, typescript: true });
        case 'html':
          return html();
        case 'css':
          return css();
        case 'json':
          return json();
        case 'markdown':
        case 'md':
          return markdown();
        case 'latex':
        case 'tex':
          // Use markdown as approximation for LaTeX, as there's no built-in LaTeX mode
          return markdown();
        default:
          // Default to markdown for unknown languages
          return markdown();
      }
    };

    // Create theme extension based on selected theme
    const themeExtension = EditorView.theme({
      '&': {
        height: '100%',
        fontSize: `${options.fontSize || 14}px`,
        fontFamily: 'var(--font-geist-mono), monospace',
      },
      '.cm-content': {
        caretColor: theme === 'dark' ? '#fff' : '#000',
      },
      '.cm-gutters': {
        backgroundColor: theme === 'dark' ? '#1e1e1e' : '#f5f5f5',
        color: theme === 'dark' ? '#858585' : '#999',
        border: 'none',
      },
      '.cm-activeLineGutter': {
        backgroundColor: theme === 'dark' ? '#2c313a' : '#e4e4e4',
      },
      '.cm-line': {
        padding: '0 4px',
      },
      '&.cm-editor.cm-focused': {
        outline: 'none',
      },
      '.cm-cursor': {
        borderLeftColor: theme === 'dark' ? '#fff' : '#000',
      },
    });

    // Create save command
    const saveCommand = keymap.of([
      {
        key: 'Mod-s',
        run: (view) => {
          const content = view.state.doc.toString();
          handleSave(content);
          return true;
        }
      }
    ]);

    // Create extensions array including our basic setup
    const extensions = [
      ...createBasicSetup(options),
      getLanguageExtension(language),
      themeExtension,
      EditorView.updateListener.of((update: any) => {
        if (update.docChanged) {
          const content = update.state.doc.toString();
          onChange?.(content);
          setFileContext(content);
          handleContentChange(content);
        }
      }),
      saveCommand,
      EditorState.readOnly.of(readOnly)
    ];

    // Add word wrap if enabled
    if (options.wordWrap === 'on' || options.wordWrap === 'wordWrapColumn') {
      extensions.push(EditorView.lineWrapping);
    }

    // Create editor state
    const state = EditorState.create({
      doc: initialValue,
      extensions
    });

    // Create and mount editor view
    const view = new EditorView({
      state,
      parent: editorRef.current
    });

    editorViewRef.current = view;

    // Cleanup on unmount
    return () => {
      if (editorViewRef.current) {
        editorViewRef.current.destroy();
      }
    };
  }, [initialValue, language, onChange, theme, options.fontSize, options.tabSize, options.wordWrap, readOnly, setFileContext]);

  const handleContentChange = (content: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveStatus('saving');
    saveTimeoutRef.current = setTimeout(() => {
      handleSave(content);
    }, 1000);
  };

  const handleSave = async (content: string) => {
    if (!onSave) return;

    try {
      // Set save status without triggering full component re-renders
      requestAnimationFrame(() => {
        setSaveStatus('saving');
      });
      
      // Call parent save function
      await onSave(content);
      
      // Update save status without affecting focus
      requestAnimationFrame(() => {
        setSaveStatus('saved');
        
        // Reset save status after 2 seconds
        setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
      });
    } catch (error) {
      console.error('Error saving:', error);
      
      // Only update status for actual errors
      requestAnimationFrame(() => {
        setSaveStatus(error instanceof Error && error.message.includes('network') ? 'disconnected' : 'error');
      });
    }
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // ToolBar handlers
  const handleInsertTable = (rows: number, cols: number) => {
    if (!editorViewRef.current) return;

    const headers = Array(cols).fill('| Header ').join('');
    const separator = Array(cols).fill('| --- ').join('');
    const cells = Array(rows).fill(Array(cols).fill('| Cell ').join('') + '|\n').join('');

    const table = `\n${headers}|\n${separator}|\n${cells}`;
    
    // Get cursor position
    const position = editorViewRef.current.state.selection.main.head;
    
    // Insert text at cursor position
    const transaction = editorViewRef.current.state.update({
      changes: { from: position, insert: table }
    });
    
    editorViewRef.current.dispatch(transaction);
  };

  const handleInsertImage = (url: string) => {
    if (!editorViewRef.current) return;
    
    const imageMarkdown = `![Image](${url})`;
    
    // Get cursor position
    const position = editorViewRef.current.state.selection.main.head;
    
    // Insert text at cursor position
    const transaction = editorViewRef.current.state.update({
      changes: { from: position, insert: imageMarkdown }
    });
    
    editorViewRef.current.dispatch(transaction);
  };

  const handleInsertEquation = (equation: string) => {
    if (!editorViewRef.current) return;
    
    const latexEquation = `$${equation}$`;
    
    // Get cursor position
    const position = editorViewRef.current.state.selection.main.head;
    
    // Insert text at cursor position
    const transaction = editorViewRef.current.state.update({
      changes: { from: position, insert: latexEquation }
    });
    
    editorViewRef.current.dispatch(transaction);
  };

  const handleExportPDF = async () => {
    // This is a placeholder for PDF export functionality
    alert('PDF export will be implemented in a future update.');
  };

  return (
    <div className="flex flex-col h-full">
      <ToolBar 
        onInsertTable={handleInsertTable}
        onInsertImage={handleInsertImage}
        onInsertEquation={handleInsertEquation}
        onExportPDF={handleExportPDF}
        saveStatus={saveStatus}
      />
      <div className="flex-1 overflow-hidden border-t border-gray-200 dark:border-gray-700">
        <div ref={editorRef} className="h-full" />
      </div>
    </div>
  );
};

export default CodeMirrorEditor; 