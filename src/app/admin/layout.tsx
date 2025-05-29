'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

// Only apply this layout to admin pages except login
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  // Don't apply layout to login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', {
        method: 'DELETE',
      });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard' },
    { name: 'Waitlist', href: '/admin/waitlist' },
    { name: 'Users', href: '/admin/users' },
    { name: 'Analytics', href: '/admin/analytics' },
    { name: 'Email Management', href: '/admin/email-management' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="flex">
        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className={`fixed top-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ${
            isSidebarOpen ? 'left-[248px]' : 'left-4'
          }`}
        >
          {isSidebarOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          )}
        </button>

        {/* Sidebar */}
        <div className={`w-64 bg-white dark:bg-gray-800 h-screen fixed left-0 shadow-lg transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Admin Panel</h2>
            </div>
            <nav className="flex-1 p-4">
              <ul className="space-y-2">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`block px-4 py-2 rounded-md transition-colors duration-200 ${
                        pathname === item.href
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <main className="p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
} 