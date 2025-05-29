'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, UserCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface Collaborator {
  _id: string;
  name: string;
  email: string;
  image?: string | null;
}

interface ShareDialogProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareDialog({ projectId, isOpen, onClose }: ShareDialogProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const fetchCollaborators = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/collaborators`);
      
      if (!response.ok) {
        console.error('Failed to fetch collaborators:', response.status, response.statusText);
        setStatus(`Error: ${response.status} ${response.statusText}`);
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Invalid content type:', contentType);
        setStatus('Error: Server returned invalid data format');
        return;
      }

      const data = await response.json();
      setCollaborators(data.collaborators);
    } catch (error) {
      console.error('Failed to fetch collaborators:', error);
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCollaborators();
    }
  }, [isOpen, projectId]);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus('');

    try {
      const response = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setStatus(`Error: ${data.error || 'Failed to share project'}`);
        } else {
          setStatus(`Error: ${response.status} ${response.statusText}`);
        }
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      setStatus('Successfully shared project');
      setEmail('');
      fetchCollaborators();
    } catch (error) {
      console.error('Failed to share project:', error);
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    setIsRemoving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/collaborators/${collaboratorId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setStatus(`Error: ${data.error || 'Failed to remove collaborator'}`);
        } else {
          setStatus(`Error: ${response.status} ${response.statusText}`);
        }
        setIsRemoving(false);
        setConfirmRemove(null);
        return;
      }

      setStatus('Collaborator removed successfully');
      fetchCollaborators();
    } catch (error) {
      console.error('Failed to remove collaborator:', error);
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRemoving(false);
      setConfirmRemove(null);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
          <Dialog.Title className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Share Project
          </Dialog.Title>

          <form onSubmit={handleShare} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Add Collaborator
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 transition-colors"
                  placeholder="Enter Gmail address"
                  required
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  {isLoading ? 'Adding...' : 'Add'}
                </button>
              </div>
            </div>

            {collaborators.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Collaborators
                </h3>
                <div className="space-y-2">
                  {collaborators.map((collaborator) => (
                    <div
                      key={collaborator._id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg group"
                    >
                      <div className="flex items-center gap-3">
                        {collaborator.image ? (
                          <img
                            src={collaborator.image}
                            alt={collaborator.name}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <UserCircleIcon className="w-8 h-8 text-gray-400" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {collaborator.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {collaborator.email}
                          </p>
                        </div>
                      </div>
                      {confirmRemove === collaborator._id ? (
                        <div className="flex items-center gap-2">
                          {isRemoving ? (
                            <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => setConfirmRemove(null)}
                                className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveCollaborator(collaborator._id)}
                                className="px-2 py-1 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
                              >
                                <ExclamationTriangleIcon className="w-4 h-4" />
                                Confirm
                              </button>
                            </>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmRemove(collaborator._id)}
                          className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove collaborator"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {status && (
              <p className={`text-sm ${status.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
                {status}
              </p>
            )}

            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
