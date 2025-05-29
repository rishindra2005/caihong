'use client';

import { useEffect, useState } from 'react';
import { useAdminApi } from '@/hooks/useAdminApi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface AnalyticsData {
  statusCounts: {
    pending?: number;
    approved?: number;
    rejected?: number;
  };
  timeSeriesData: Array<{
    date: string;
    count: number;
  }>;
  conversionRate: number;
  totalSignups: number;
}

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { fetchWithAuth } = useAdminApi();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await fetchWithAuth('/api/admin/analytics');
      if (!response.ok) {
        throw new Error('Failed to load analytics');
      }
      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading analytics...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!analyticsData) {
    return <div>No data available</div>;
  }

  const timeSeriesChartData = {
    labels: analyticsData.timeSeriesData.map(d => d.date),
    datasets: [
      {
        label: 'Daily Signups',
        data: analyticsData.timeSeriesData.map(d => d.count),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.3,
      },
    ],
  };

  const statusChartData = {
    labels: ['Pending', 'Approved', 'Rejected'],
    datasets: [
      {
        data: [
          analyticsData.statusCounts.pending || 0,
          analyticsData.statusCounts.approved || 0,
          analyticsData.statusCounts.rejected || 0,
        ],
        backgroundColor: [
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 99, 132, 0.8)',
        ],
        borderColor: [
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Total Signups</h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {analyticsData.totalSignups}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Conversion Rate</h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            {analyticsData.conversionRate}%
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Pending Approvals</h3>
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
            {analyticsData.statusCounts.pending || 0}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Signups Over Time</h3>
          <div className="h-[300px]">
            <Line
              data={timeSeriesChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1,
                    },
                  },
                },
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                  title: {
                    display: false,
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status Distribution</h3>
          <div className="h-[300px] flex items-center justify-center">
            <div className="w-[250px]">
              <Doughnut
                data={statusChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom' as const,
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 