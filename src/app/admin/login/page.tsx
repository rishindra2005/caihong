'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [sshKey, setSshKey] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check if already authenticated
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/auth/check');
      if (response.ok) {
        // If already authenticated, redirect to dashboard
        router.push('/admin/dashboard');
        return;
      }
    } catch (error) {
      // Ignore error, just show login form
    }
    setIsLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sshKey }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Redirect to admin dashboard
      router.push('/admin/dashboard');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Authentication failed');
      setIsLoading(false);
    }
  };

  // Show loading state only during initial auth check
  if (isLoading && !error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Admin Login</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label 
              htmlFor="sshKey" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              SSH Key
            </label>
            <textarea
              id="sshKey"
              value={sshKey}
              onChange={(e) => setSshKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              rows={4}
              placeholder="Enter your SSH key"
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                Logging in...
              </span>
            ) : (
              'Login'
            )}
          </button>
        </form>
      </div>
    </div>
  );
} 