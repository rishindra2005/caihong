'use client';

import { useSearchParams } from 'next/navigation';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
        <p className="text-red-500">{error || 'An error occurred during authentication'}</p>
        <a href="/" className="text-blue-500 hover:underline mt-4 block">
          Return to Home
        </a>
      </div>
    </div>
  );
} 