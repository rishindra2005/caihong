'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

const CREDIT_PACKAGES = [
  { id: 'basic', name: 'Basic', credits: 100, price: 5, popular: false },
  { id: 'standard', name: 'Standard', credits: 500, price: 20, popular: true },
  { id: 'premium', name: 'Premium', credits: 1000, price: 35, popular: false },
  { id: 'unlimited', name: 'Enterprise', credits: 5000, price: 150, popular: false }
];

interface CreditHistoryItem {
  id: string;
  amount: number;
  beforeBalance: number;
  afterBalance: number;
  description: string;
  projectId?: string;
  projectName?: string;
  action?: string;
  timestamp: string;
  date: string;
}

export default function BillingPage() {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  
  // History state
  const [history, setHistory] = useState<CreditHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch transaction history when the component mounts
  useEffect(() => {
    fetchHistory();
  }, [currentPage]);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/credits/history?limit=${itemsPerPage}&skip=${(currentPage - 1) * itemsPerPage}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch credit history');
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.history)) {
        setHistory(data.history);
        // If the API supports pagination, handle it here
        if (data.pagination) {
          setTotalPages(Math.ceil(data.pagination.total / itemsPerPage));
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching credit history:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleRefresh = () => {
    fetchHistory();
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    
    setIsProcessing(true);
    
    try {
      // This would connect to a real payment processor in production
      // For now, we'll just simulate a purchase by adding credits directly
      const selectedPkg = CREDIT_PACKAGES.find(pkg => pkg.id === selectedPackage);
      
      if (!selectedPkg) {
        throw new Error('Invalid package selection');
      }
      
      // Call the transaction API to add credits
      const response = await fetch('/api/admin/credits/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: selectedPkg.credits,
          description: `Purchased ${selectedPkg.name} credit package ($${selectedPkg.price})`,
          password: process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'demo', // In production, use a secure method
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to process purchase');
      }
      
      // Refresh to show new credits and history
      fetchHistory();
      router.refresh();
    } catch (error) {
      console.error('Error processing purchase:', error);
      alert('Failed to process purchase. Please try again later.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing & Credits</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Purchase credit packages and view transaction history
          </p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={isLoadingHistory}
          className="flex items-center px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <ArrowPathIcon className={`w-4 h-4 mr-2 ${isLoadingHistory ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Credit Packages */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Credit Packages</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {CREDIT_PACKAGES.map((pkg) => (
            <div 
              key={pkg.id}
              className={`
                border rounded-lg overflow-hidden shadow-sm transition-all 
                ${selectedPackage === pkg.id 
                  ? 'border-blue-500 shadow-md dark:border-blue-400' 
                  : 'border-gray-200 dark:border-gray-700'}
                ${pkg.popular ? 'relative' : ''}
              `}
              onClick={() => setSelectedPackage(pkg.id)}
            >
              {pkg.popular && (
                <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-bl-lg">
                  Most Popular
                </div>
              )}
              <div className="p-6 bg-white dark:bg-gray-800">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{pkg.name}</h3>
                <p className="mt-4 flex items-baseline">
                  <span className="text-3xl font-extrabold text-gray-900 dark:text-white">${pkg.price}</span>
                  <span className="ml-1 text-gray-500 dark:text-gray-400">/one-time</span>
                </p>
                <p className="mt-1 text-lg text-blue-600 dark:text-blue-400 font-medium">
                  {pkg.credits} credits
                </p>
                <ul className="mt-6 space-y-3">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="ml-2 text-gray-700 dark:text-gray-300">No subscription</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="ml-2 text-gray-700 dark:text-gray-300">One-time payment</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="ml-2 text-gray-700 dark:text-gray-300">Never expires</span>
                  </li>
                </ul>
              </div>
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700">
                <input 
                  type="radio" 
                  name="package" 
                  id={pkg.id} 
                  className="mr-2" 
                  checked={selectedPackage === pkg.id}
                  onChange={() => setSelectedPackage(pkg.id)}
                />
                <label htmlFor={pkg.id} className="text-gray-700 dark:text-gray-300">
                  Select {pkg.name} package
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-8">
          <button
            onClick={handlePurchase}
            disabled={!selectedPackage || isProcessing}
            className={`
              px-6 py-3 text-base font-medium rounded-md shadow-sm 
              ${!selectedPackage || isProcessing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
              }
            `}
          >
            {isProcessing ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              'Purchase Credits'
            )}
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Transaction History</h2>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 mb-6 rounded-md border border-red-200 dark:border-red-800">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Project
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Before
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    After
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {isLoadingHistory ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12">
                      <div className="flex justify-center">
                        <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    </td>
                  </tr>
                ) : history.length > 0 ? (
                  history.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {item.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {item.description}
                        {item.action && (
                          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                            {item.action}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {item.projectName || (item.projectId ? (
                          <span className="text-xs font-mono">{item.projectId.substring(0, 8)}...</span>
                        ) : '-')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {item.beforeBalance}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={item.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                          {item.amount >= 0 ? `+${item.amount}` : item.amount}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {item.afterBalance}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      No transaction history found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-600 sm:px-6">
              <div className="flex-1 flex justify-between items-center">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1 || isLoadingHistory}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Previous
                </button>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                </p>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || isLoadingHistory}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Credit Usage Information */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Credit Usage</h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Credits are used for various operations in the platform:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">AI Features</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>Code generation: 2-5 credits</li>
                <li>AI assistance: 1-3 credits</li>
                <li>Advanced completions: 2 credits</li>
              </ul>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Project Operations</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>Project compilation: 1 credit</li>
                <li>Code analysis: 1 credit</li>
                <li>File operations: Free</li>
              </ul>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Collaboration</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>Sharing projects: Free</li>
                <li>Team collaboration: 1 credit/member/day</li>
                <li>Git operations: Free</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 