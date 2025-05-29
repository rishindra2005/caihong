import { XMarkIcon } from '@heroicons/react/24/outline';

interface KeyboardShortcutHelpProps {
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
}

export default function KeyboardShortcutHelp({ onClose }: KeyboardShortcutHelpProps) {
  const shortcuts: ShortcutItem[] = [
    { keys: ['Ctrl', 'C'], description: 'Copy selected item(s)' },
    { keys: ['Ctrl', 'X'], description: 'Cut selected item(s)' },
    { keys: ['Ctrl', 'V'], description: 'Paste from clipboard' },
    { keys: ['Delete'], description: 'Delete selected item(s)' },
    { keys: ['F2'], description: 'Rename selected item' },
    { keys: ['Ctrl', 'N'], description: 'Create new file' },
    { keys: ['Ctrl', 'Shift', 'N'], description: 'Create new folder' },
    { keys: ['Ctrl', 'Alt', 'C'], description: 'Collapse all folders' },
    { keys: ['Ctrl', 'H'], description: 'Toggle shortcut help' },
    { keys: ['Click'], description: 'Select a single item' },
    { keys: ['Ctrl', 'Click'], description: 'Toggle item selection' },
    { keys: ['Shift', 'Click'], description: 'Add to selection' },
    { keys: ['Double Click'], description: 'Open file or toggle folder' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-80 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-2">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex justify-between text-sm">
              <div className="flex items-center space-x-1">
                {shortcut.keys.map((key, keyIndex) => (
                  <span key={keyIndex}>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 text-xs font-mono">
                      {key}
                    </kbd>
                    {keyIndex < shortcut.keys.length - 1 && <span className="mx-1">+</span>}
                  </span>
                ))}
              </div>
              <span className="text-gray-600 dark:text-gray-400 ml-2 text-right">
                {shortcut.description}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 