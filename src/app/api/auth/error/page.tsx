'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-red-600 dark:text-red-400">
          Authentication Error
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          {error === 'AccessDenied' 
            ? 'You do not have permission to sign in.'
            : 'There was an error signing in with Google.'}
        </p>
        <Link 
          href="/"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
