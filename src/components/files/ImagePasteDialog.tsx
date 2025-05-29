import { useEffect, useRef, useState } from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ImagePasteDialogProps {
  imageData: string;
  onClose: () => void;
  onSave: (fileName: string) => void;
  suggestedName?: string;
}

export default function ImagePasteDialog({
  imageData,
  onClose,
  onSave,
  suggestedName = 'pasted_image'
}: ImagePasteDialogProps) {
  const [fileName, setFileName] = useState(suggestedName);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // When component mounts, focus the input and select the filename (excluding extension)
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      
      // Select just the filename part, not the extension
      const dotIndex = suggestedName.lastIndexOf('.');
      if (dotIndex > 0) {
        inputRef.current.setSelectionRange(0, dotIndex);
      } else {
        inputRef.current.select();
      }
    }
  }, [suggestedName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fileName.trim()) {
      onSave(fileName);
    }
  };

  // Extract the file extension for display
  const getExtensionFromImageData = () => {
    if (imageData.startsWith('data:image/png;')) return '.png';
    if (imageData.startsWith('data:image/jpeg;') || imageData.startsWith('data:image/jpg;')) return '.jpg';
    if (imageData.startsWith('data:image/gif;')) return '.gif';
    if (imageData.startsWith('data:image/webp;')) return '.webp';
    return '.png'; // Default
  };

  // Ensure we're setting just the filename part without extension
  const handleFileNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    // Don't modify extension if it exists in suggestedName
    const dotIndex = suggestedName.lastIndexOf('.');
    if (dotIndex > 0) {
      const ext = suggestedName.substring(dotIndex);
      if (!newName.endsWith(ext)) {
        setFileName(newName);
        return;
      }
    }
    setFileName(newName);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Save Pasted Image</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mb-4 bg-gray-100 dark:bg-gray-700 p-2 rounded flex justify-center">
          <img 
            src={imageData} 
            alt="Pasted image" 
            className="max-h-40 max-w-full object-contain rounded shadow-sm" 
          />
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="fileName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              File Name
            </label>
            <div className="flex items-center">
              <input
                ref={inputRef}
                id="fileName"
                type="text"
                value={fileName}
                onChange={handleFileNameChange}
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                placeholder="Enter file name"
              />
              <span className="ml-2 text-gray-500 dark:text-gray-400">
                {fileName.includes('.') ? '' : getExtensionFromImageData()}
              </span>
            </div>
          </div>
          
          <div className="flex space-x-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <CheckIcon className="w-5 h-5 mr-2" />
              Save Image
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 