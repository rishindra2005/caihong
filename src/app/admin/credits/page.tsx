'use client';

import { useState } from 'react';

export default function AddCreditsPage() {
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [storageLimit, setStorageLimit] = useState('');
  const [storageLimitStatus, setStorageLimitStatus] = useState('');
  const [isStorageUpdateLoading, setIsStorageUpdateLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus('');
    
    try {
      const response = await fetch('/api/admin/credits/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: parseFloat(amount),
          description: description || `Admin credit addition for ${email}`,
          password,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setStatus(`Success! Added ${amount} credits to ${email}. New balance: ${data.credits}`);
        setEmail('');
        setAmount('');
        setDescription('');
        setPassword('');
      } else {
        setStatus(`Error: ${data.error}${data.details ? ` (${data.details})` : ''}`);
      }
    } catch (error) {
      setStatus(`Failed to add credits: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStorageLimitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsStorageUpdateLoading(true);
    setStorageLimitStatus('');
    
    try {
      const response = await fetch('/api/admin/credits/storage-limit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          storageLimit: parseInt(storageLimit) * 1024 * 1024, // Convert MB to bytes
          password,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setStorageLimitStatus(`Success! Updated storage limit for project ${projectId} to ${storageLimit}MB`);
        setProjectId('');
        setStorageLimit('');
      } else {
        setStorageLimitStatus(`Error: ${data.error}${data.details ? ` (${data.details})` : ''}`);
      }
    } catch (error) {
      setStorageLimitStatus(`Failed to update storage limit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsStorageUpdateLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-12">
        {/* Credits Form */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">Add Credits</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                User Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Credits Amount
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="any"
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description for this credit addition"
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:bg-blue-400 dark:disabled:bg-blue-400/70"
            >
              {isLoading ? 'Adding Credits...' : 'Add Credits'}
            </button>
          </form>
          {status && (
            <p className={`mt-4 text-center ${status.includes('Error') || status.includes('Failed') ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              {status}
            </p>
          )}
        </div>

        {/* Storage Limit Form */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">Update Project Storage Limit</h2>
          <form onSubmit={handleStorageLimitSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Project ID
              </label>
              <input
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Storage Limit (MB)
              </label>
              <input
                type="number"
                value={storageLimit}
                onChange={(e) => setStorageLimit(e.target.value)}
                min="1"
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isStorageUpdateLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:bg-blue-400 dark:disabled:bg-blue-400/70"
            >
              {isStorageUpdateLoading ? 'Updating Storage Limit...' : 'Update Storage Limit'}
            </button>
          </form>
          {storageLimitStatus && (
            <p className={`mt-4 text-center ${storageLimitStatus.includes('Error') || storageLimitStatus.includes('Failed') ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              {storageLimitStatus}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
