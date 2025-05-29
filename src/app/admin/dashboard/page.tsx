'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminApi } from '@/hooks/useAdminApi';
import Link from 'next/link';

interface WaitlistEntry {
  _id: string;
  email: string;
  name?: string;
  signupDate: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface DashboardStats {
  totalUsers: number;
  totalWaitlist: number;
  pendingApprovals: number;
  recentSignups: number;
}

export default function Dashboard() {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const router = useRouter();
  const { fetchWithAuth } = useAdminApi();

  useEffect(() => {
    loadWaitlist();
    loadDashboardStats();
  }, []);

  const loadWaitlist = async () => {
    try {
      const response = await fetchWithAuth('/api/admin/waitlist');
      
      if (!response.ok) {
        throw new Error('Failed to load waitlist');
      }

      const data = await response.json();
      setWaitlist(data.entries);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load waitlist');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const response = await fetchWithAuth('/api/admin/dashboard/stats');
      if (!response.ok) {
        throw new Error('Failed to load dashboard stats');
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load dashboard stats');
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      const response = await fetchWithAuth('/api/admin/waitlist', {
        method: 'POST',
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Update local state
      setWaitlist(current =>
        current.map(entry =>
          entry._id === id ? { ...entry, status: newStatus } : entry
        )
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Users Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Users</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.totalUsers || 0}</p>
          </div>

          {/* Waitlist Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Waitlist</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.totalWaitlist || 0}</p>
          </div>

          {/* Pending Approvals Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Pending Approvals</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.pendingApprovals || 0}</p>
          </div>

          {/* Recent Signups Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Recent Signups (24h)</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.recentSignups || 0}</p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/admin/waitlist"
              className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white">Manage Waitlist</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Review and approve waitlist entries</p>
            </Link>
            <Link
              href="/admin/users"
              className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white">User Management</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">View and manage user accounts</p>
            </Link>
            <Link
              href="/admin/analytics"
              className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white">Analytics</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">View detailed analytics and reports</p>
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden mt-8">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Signup Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {waitlist.map((entry) => (
                <tr key={entry._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {entry.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {entry.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {new Date(entry.signupDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      entry.status === 'approved' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : entry.status === 'rejected'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {entry.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleStatusChange(entry._id, 'approved')}
                          className="text-green-600 hover:text-green-900 dark:hover:text-green-400"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleStatusChange(entry._id, 'rejected')}
                          className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 