'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function EmailSignInButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const result = await signIn('credentials', {
        email,
        password,
        callbackUrl: '/dashboard',
        redirect: true,
      });
      
      if (result?.error) {
        console.error('Sign in error:', result.error);
      }
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full flex items-center justify-center px-4 py-3 mt-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm 
                 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 
                 hover:bg-gray-50 dark:hover:bg-gray-700 
                 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 
                 transition-all duration-200 ease-in-out"
      >
        <svg 
          className="h-5 w-5 mr-2" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
          />
        </svg>
        Sign in with Email
      </button>
    );
  }

  return (
    <form onSubmit={handleSignIn} className="mt-3 space-y-3">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md 
                   shadow-sm placeholder-gray-400 dark:placeholder-gray-500
                   focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400
                   text-gray-900 dark:text-white dark:bg-gray-800 sm:text-sm"
          placeholder="your@email.com"
        />
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md 
                   shadow-sm placeholder-gray-400 dark:placeholder-gray-500
                   focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400
                   text-gray-900 dark:text-white dark:bg-gray-800 sm:text-sm"
          placeholder="••••••••"
        />
      </div>
      
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                  hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900
                  disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
      </div>
    </form>
  );
} 