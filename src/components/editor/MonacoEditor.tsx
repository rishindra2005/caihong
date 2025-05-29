// Monaco editor setup with:
// - LaTeX syntax highlighting
// - Auto-completion
// - File handling 

import { useEffect, useRef, useState } from 'react';
import { Editor, OnMount } from '@monaco-editor/react';
import { useAI } from '../ai/AIProvider';
import ToolBar from './ToolBar';

// Define props interface
interface MonacoEditorProps {
  initialValue?: string;
  language?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  onSave?: (content: string) => Promise<void>;
  theme?: string;  // Add theme prop
  options?: {      // Add options prop
    wordWrap?: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
    fontSize?: number;
    tabSize?: number;
    scrollBeyondLastLine?: boolean;
    minimap?: {
      enabled?: boolean;
    };
    [key: string]: any; // Allow other Monaco editor options
  };
  /**
   * Called when the user triggers compile (Ctrl+Enter or command palette)
   */
  onCompile?: () => void;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
  initialValue = '',
  language = 'markdown',
  onChange,
  readOnly = false,
  onSave,
  theme: propTheme,
  options = {},
  onCompile,
}) => {
  const editorRef = useRef<any>(null);
  const { setFileContext } = useAI();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'disconnected'>('idle');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldRefocusAfterCompile = useRef(false);

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

  // Effect to update editor options when props change
  useEffect(() => {
    if (!editorRef.current) return;
    
    // Update the editor options when they change
    const editorOptions = {
      readOnly,
      
      // Handle specific options from props
      minimap: {
        enabled: options.minimap?.enabled !== undefined 
          ? Boolean(options.minimap.enabled) 
          : true
      },
      
      wordWrap: options.wordWrap || 'on' as 'on' | 'off' | 'wordWrapColumn' | 'bounded',
      
      fontSize: options.fontSize !== undefined 
        ? Number(options.fontSize) 
        : 14,
        
      tabSize: options.tabSize !== undefined 
        ? Number(options.tabSize) 
        : 2,
        
      scrollBeyondLastLine: options.scrollBeyondLastLine !== undefined 
        ? Boolean(options.scrollBeyondLastLine) 
        : false,
    };
    
    console.log('Updating editor options:', editorOptions);
    
    // Apply the updated options
    editorRef.current.updateOptions(editorOptions);
    
  }, [readOnly, options]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Configure Monaco Editor for LaTeX
    monaco.languages.register({ id: 'latex' });
    monaco.languages.setMonarchTokensProvider('latex', {
      tokenizer: {
        root: [
          [/\\[a-zA-Z]+/, 'keyword'],
          [/\$\$[\s\S]*?\$\$/, 'string'],
          [/\$[\s\S]*?\$/, 'string'],
          [/%.*$/, 'comment'],
          [/[{}]/, 'delimiter'],
          [/[&_^]/, 'operator'],
        ],
      },
    });

    // Configure Monaco Editor for BibTeX
    monaco.languages.register({ id: 'bibtex' });
    monaco.languages.setMonarchTokensProvider('bibtex', {
      tokenizer: {
        root: [
          [/^@\w+/, 'keyword'],          // Entry types like @article, @book
          [/[{}]/, 'delimiter'],          // Braces
          [/[=,]/, 'delimiter'],          // Equals, commas
          [/"[^"]*"/, 'string'],          // Double-quoted strings
          [/{[^{}]*}/, 'string'],         // Braced content
          [/\d+/, 'number'],              // Numbers
          [/%.*$/, 'comment'],            // Comments
          [/[a-zA-Z0-9_-]+(?=\s*=)/, 'type.identifier'] // Field names
        ],
      },
    });

    // LaTeX snippets for auto-completion
    monaco.languages.registerCompletionItemProvider('latex', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };

        const suggestions = [
          {
            label: '\\begin{equation}',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '\\begin{equation}\n\t$0\n\\end{equation}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range
          },
          {
            label: '\\frac',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '\\frac{$1}{$2}$0',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range
          },
        ];
        return { suggestions };
      }
    });

    // BibTeX snippets for auto-completion
    monaco.languages.registerCompletionItemProvider('bibtex', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };

        const suggestions = [
          {
            label: '@article',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '@article{$1,\n\tauthor = {$2},\n\ttitle = {$3},\n\tjournal = {$4},\n\tyear = {$5},\n\tvolume = {$6},\n\tnumber = {$7},\n\tpages = {$8}\n}$0',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range
          },
          {
            label: '@book',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '@book{$1,\n\tauthor = {$2},\n\ttitle = {$3},\n\tpublisher = {$4},\n\tyear = {$5}\n}$0',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range
          },
          {
            label: '@inproceedings',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '@inproceedings{$1,\n\tauthor = {$2},\n\ttitle = {$3},\n\tbooktitle = {$4},\n\tyear = {$5},\n\tpages = {$6}\n}$0',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range
          }
        ];
        return { suggestions };
      }
    });

    // Initial editor options setup
    const defaultOptions = {
      minimap: { enabled: true },
      lineNumbers: 'on' as const,
      roundedSelection: true,
      fontFamily: 'var(--font-geist-mono)',
    };

    // Apply initial options
    const initialEditorOptions = {
      ...defaultOptions,
      readOnly,
      minimap: {
        enabled: options.minimap?.enabled !== undefined 
          ? Boolean(options.minimap.enabled) 
          : true
      },
      wordWrap: options.wordWrap || 'on' as 'on' | 'off' | 'wordWrapColumn' | 'bounded',
      fontSize: options.fontSize !== undefined 
        ? Number(options.fontSize) 
        : 14,
      tabSize: options.tabSize !== undefined 
        ? Number(options.tabSize) 
        : 2,
      scrollBeyondLastLine: options.scrollBeyondLastLine !== undefined 
        ? Boolean(options.scrollBeyondLastLine) 
        : false,
    };

    // Apply options to the editor
    editor.updateOptions(initialEditorOptions);

    // Set up context for AI assistance and handle changes
    editor.onDidChangeModelContent(() => {
      const content = editor.getValue();
      setFileContext(content);
      onChange?.(content);
      handleContentChange(content);
    });

    // Add keyboard shortcut for save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      const content = editor.getValue();
      handleSave(content);
    });

    // Register Compile command (Ctrl+Enter)
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      () => {
        if (onCompile) onCompile();
        shouldRefocusAfterCompile.current = true;
        setTimeout(() => editor.focus(), 0);
      },
      ''
    );
    // Add to command palette
    editor.addAction({
      id: 'compile-latex',
      label: 'Compile LaTeX (Ctrl+Enter)',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => {
        if (onCompile) onCompile();
        shouldRefocusAfterCompile.current = true;
        setTimeout(() => editor.focus(), 0);
      },
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1.5,
    });
  };

  // Effect: if shouldRefocusAfterCompile is set and editorRef.current exists, focus editor
  useEffect(() => {
    if (shouldRefocusAfterCompile.current && editorRef.current) {
      editorRef.current.focus();
      shouldRefocusAfterCompile.current = false;
    }
  });

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

    // Set status to saving
    requestAnimationFrame(() => {
      setSaveStatus('saving');
    });

    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('network-timeout'));
      }, 5000);
    });

    try {
      // Race the save and the timeout
      await Promise.race([
        (async () => {
          await onSave(content);
        })(),
        timeoutPromise
      ]);

      // If we get here, save succeeded before timeout
      requestAnimationFrame(() => {
        setSaveStatus('saved');
        setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
      });
    } catch (error: any) {
      // If timeout or network error, show disconnected
      if (error instanceof Error && (error.message === 'network-timeout' || error.message.includes('network'))) {
        requestAnimationFrame(() => {
          setSaveStatus('disconnected');
        });
      } else {
        // Other errors
        requestAnimationFrame(() => {
          setSaveStatus('error');
        });
      }
    }
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleInsertTable = (rows: number, cols: number) => {
    if (!editorRef.current) return;

    const headers = Array(cols).fill('| Header ').join('');
    const separator = Array(cols).fill('| --- ').join('');
    const cells = Array(rows).fill(Array(cols).fill('| Cell ').join('') + '|\n').join('');

    const table = `\n${headers}|\n${separator}|\n${cells}`;
    const position = editorRef.current.getPosition();
    editorRef.current.executeEdits('insert-table', [{
      range: {
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      },
      text: table,
    }]);
  };

  const handleInsertImage = (url: string) => {
    if (!editorRef.current) return;
    const imageMarkdown = `![Image](${url})`;
    const position = editorRef.current.getPosition();
    editorRef.current.executeEdits('insert-image', [{
      range: {
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      },
      text: imageMarkdown,
    }]);
  };

  const handleInsertEquation = (equation: string) => {
    if (!editorRef.current) return;
    const latexEquation = `$${equation}$`;
    const position = editorRef.current.getPosition();
    editorRef.current.executeEdits('insert-equation', [{
      range: {
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      },
      text: latexEquation,
    }]);
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
        <Editor
          height="100%"
          defaultLanguage={language}
          defaultValue={initialValue}
          theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
          onMount={handleEditorDidMount}
        />
      </div>
    </div>
  );
};

export default MonacoEditor; 