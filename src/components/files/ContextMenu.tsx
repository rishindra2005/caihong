import { useEffect } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  options: {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
  }[];
}

export default function ContextMenu({ x, y, onClose, options }: ContextMenuProps) {
  useEffect(() => {
    const handleClick = () => onClose();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [onClose]);

  return (
    <div
      className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 z-50"
      style={{ left: x, top: y }}
    >
      {options.map((option, index) => (
        <button
          key={index}
          className="w-full px-4 py-2 text-left flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={option.onClick}
        >
          <div className="w-5 h-5">{option.icon}</div>
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
} 