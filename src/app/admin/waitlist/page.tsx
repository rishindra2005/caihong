'use client';

import { useEffect, useState } from 'react';
import { useAdminApi } from '@/hooks/useAdminApi';

interface WaitlistEntry {
  _id: string;
  email: string;
  name?: string;
  signupDate: string;
  status: 'pending' | 'approved' | 'rejected';
}

type SortField = 'email' | 'name' | 'signupDate' | 'status';
type SortOrder = 'asc' | 'desc';

export default function WaitlistManagement() {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('signupDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const { fetchWithAuth } = useAdminApi();

  useEffect(() => {
    loadWaitlist();
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

  const handleStatusChange = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      const response = await fetchWithAuth('/api/admin/waitlist', {
        method: 'POST',
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      setWaitlist(current =>
        current.map(entry =>
          entry._id === id ? { ...entry, status: newStatus } : entry
        )
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update status');
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(current => current === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const filteredAndSortedWaitlist = waitlist
    .filter(entry => 
      (filter === 'all' ? true : entry.status === filter) &&
      (searchTerm === '' ? true : 
        entry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      )
    )
    .sort((a, b) => {
      const order = sortOrder === 'asc' ? 1 : -1;
      
      switch (sortField) {
        case 'email':
          return a.email.localeCompare(b.email) * order;
        case 'name':
          return ((a.name || '').localeCompare(b.name || '')) * order;
        case 'status':
          return a.status.localeCompare(b.status) * order;
        case 'signupDate':
          return (new Date(a.signupDate).getTime() - new Date(b.signupDate).getTime()) * order;
        default:
          return 0;
      }
    });

  if (loading) {
    return <div>Loading waitlist...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Waitlist Management</h1>
        <div className="flex gap-4">
          <button
            onClick={async () => {
              try {
                const response = await fetchWithAuth('/api/admin/waitlist/download');
                if (!response.ok) throw new Error('Download failed');
                
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'waitlist-data.json';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
              } catch (error) {
                setError('Failed to download waitlist data');
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download JSON
          </button>
          <input
            type="text"
            placeholder="Search by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2"
          >
            <option value="all">All Entries</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('email')}
                >
                  Email {getSortIcon('email')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('name')}
                >
                  Name {getSortIcon('name')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('signupDate')}
                >
                  Signup Date {getSortIcon('signupDate')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('status')}
                >
                  Status {getSortIcon('status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAndSortedWaitlist.map((entry) => (
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