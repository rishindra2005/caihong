'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

// Only apply this layout to admin pages except login
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

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
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 h-screen fixed left-0 shadow-lg">
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
                      className={`block px-4 py-2 rounded-md ${
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
                className="w-full px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 ml-64">
          <main className="p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
} 