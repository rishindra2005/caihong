'use client';

import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { TrashIcon } from '@heroicons/react/24/outline';

interface EditProjectDialogProps {
  projectId: string;
  initialName: string;
  initialDescription: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function EditProjectDialog({
  projectId,
  initialName,
  initialDescription,
  isOpen,
  onClose,
  onUpdate
}: EditProjectDialogProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus('');

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('Successfully updated project');
        onUpdate();
        setTimeout(onClose, 1000);
      } else {
        setStatus(`Error: ${data.error}`);
      }
    } catch (error) {
      setStatus('Failed to update project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    setStatus('');

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setStatus('Project deleted successfully');
        onUpdate();
        setTimeout(onClose, 1000);
      } else {
        const data = await response.json();
        setStatus(`Error: ${data.error}`);
      }
    } catch (error) {
      setStatus('Failed to delete project');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md transform transition-all">
          <Dialog.Title className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Edit Project
          </Dialog.Title>
          <form onSubmit={handleUpdate} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Project Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 transition-colors"
                required
              />
            </div>
            
            {!showDeleteConfirm ? (
              <div className="flex justify-between items-center mt-6">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  <TrashIcon className="w-5 h-5 mr-2" />
                  Delete Project
                </button>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <p className="text-sm text-red-600 dark:text-red-400">
                  Are you sure you want to delete this project? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    {isLoading ? 'Deleting...' : 'Delete Project'}
                  </button>
                </div>
              </div>
            )}
            
            {status && (
              <p className={`text-sm ${status.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
                {status}
              </p>
            )}
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 