'use client';

import { signIn } from 'next-auth/react';
import Image from 'next/image';
import EmailSignInButton from '@/components/auth/EmailSignInButton';
import { useEffect, useState } from 'react';

export default function SignInPage() {
  const [isDevelopment, setIsDevelopment] = useState(false);

  useEffect(() => {
    // Check for development mode on the client side
    setIsDevelopment(process.env.NODE_ENV === 'development');
  }, []);

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/dashboard' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div className="text-center space-y-2">
          <div className="mx-auto w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center">
            <svg 
              className="w-12 h-12 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" 
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome Back</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Sign in to access your AI workspace
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm 
                     bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 
                     hover:bg-gray-50 dark:hover:bg-gray-700 
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 
                     transition-all duration-200 ease-in-out"
          >
            <Image
              src="/google.svg"
              alt="Google logo"
              width={20}
              height={20}
              className="w-5 h-5"
            />
            <span className="text-base font-medium">Continue with Google</span>
          </button>

          {/* Show Email sign-in option only in development mode */}
          {isDevelopment && <EmailSignInButton />}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                Secure authentication
              </span>
            </div>
          </div>

          <p className="text-xs text-center text-gray-600 dark:text-gray-400">
            By signing in, you agree to our{' '}
            <a href="#" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 