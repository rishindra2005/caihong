'use client';

import Link from 'next/link';
import { useState } from 'react';
import EditProfileButton from '@/components/auth/EditProfileButton';
import SignOutButton from '@/components/auth/SignOutButton';
import { HomeIcon, CreditCardIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/theme/ThemeToggle';

interface NavbarClientProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    credits: number;
    metadata?: string;
  };
}

export default function NavbarClient({ user }: NavbarClientProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  const refreshCredits = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      // This will trigger a server-side revalidation
      router.refresh();
      
      // Add a small delay to show the refresh animation
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex items-center space-x-6">
      {/* Credits Display */}
      <button
        onClick={refreshCredits}
        className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-all group"
      >
        <CreditCardIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {user.credits} Credits
        </span>
        <ArrowPathIcon className={`w-4 h-4 text-gray-400 transition-all ${isRefreshing ? 'rotate-180' : ''} group-hover:text-gray-600 dark:group-hover:text-gray-200`} />
      </button>
      
      {/* Theme Toggle */}
      <ThemeToggle />
      
      {/* User Dropdown */}
      <div className="relative">
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div className="relative">
            <img
              src={user.image || '/default-avatar.png'}
              alt={user.name || 'User Avatar'}
              className="w-8 h-8 rounded-full ring-2 ring-blue-600/20"
            />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {user.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
              {user.email}
            </p>
          </div>
        </button>
        
        {/* Dropdown Menu */}
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setIsMenuOpen(false)}
            />
            
            {/* Menu */}
            <div className="absolute right-0 mt-2 w-64 py-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                <div className="mt-2 flex items-center space-x-2 sm:hidden">
                  <button
                    onClick={refreshCredits}
                    className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <CreditCardIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>{user.credits} Credits</span>
                    <ArrowPathIcon className={`w-3 h-3 text-gray-400 transition-all ${isRefreshing ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
              <div className="px-2 py-2 space-y-1">
                <Link
                  href="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <HomeIcon className="w-5 h-5" />
                  <span>Dashboard</span>
                </Link>
                <EditProfileButton user={user} />
                <SignOutButton />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 