'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) return;
    
    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waitlist');
      }

      setStatus('success');
      setMessage('Thanks for joining! We\'ll notify you when we launch.');
      setEmail('');
      router.refresh(); // Refresh the page to update the counter
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Something went wrong');
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 backdrop-blur-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
          disabled={status === 'loading'}
          required
        />
        <button
          type="submit"
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            status === 'loading'
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Joining...' : 'Join Waitlist'}
        </button>
      </form>

      {message && (
        <div className={`text-sm ${
          status === 'success' ? 'text-green-400' : 'text-red-400'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
} 