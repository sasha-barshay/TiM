import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { reportsApi } from '../../services/api';
import {
  Clock,
  DollarSign,
  TrendingUp,
  Calendar,
  Users,
  Activity,
} from 'lucide-react';
import { DashboardData } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const currentMonth = new Date();
  const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

  // Safe number parsing function
  const safeNumber = (value: any, defaultValue: number = 0): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? defaultValue : parsed;
    }
    return defaultValue;
  };

  const { data: dashboardData, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['dashboard', startDate, endDate],
    queryFn: () => reportsApi.getDashboard({ startDate, endDate }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    toast.error('Failed to load dashboard data');
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load dashboard data</p>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { summary, statusStats, topCustomers, recentEntries, monthlyTrend } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            {format(new Date(startDate), 'MMMM yyyy')} overview
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Current Period</p>
          <p className="text-sm font-medium text-gray-900">
            {format(new Date(startDate), 'MMM d')} - {format(new Date(endDate), 'MMM d')}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Hours</p>
                <p className="text-2xl font-bold text-gray-900">
                  {safeNumber(summary.totalHours).toFixed(1)}
                </p>
              </div>
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Earnings</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${safeNumber(summary.totalEarnings).toFixed(0)}
                </p>
              </div>
              <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-success-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Entries</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.totalEntries}
                </p>
              </div>
              <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-warning-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg/Day</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(summary.totalHours / 30).toFixed(1)}
                </p>
              </div>
              <div className="w-10 h-10 bg-info-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-info-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Overview */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Status Overview</h2>
        </div>
        <div className="card-body">
          <div className="space-y-3">
            {statusStats.map((stat) => (
              <div key={stat.status} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full status-${stat.status}`} />
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {stat.status}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{stat.count}</p>
                  <p className="text-xs text-gray-500">{safeNumber(stat.hours).toFixed(1)}h</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Customers */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Top Customers</h2>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            {topCustomers.map((customer, index) => (
              <div key={customer.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary-600">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                    <p className="text-xs text-gray-500">{customer.entryCount || 0} entries</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {safeNumber(customer.totalHours).toFixed(1)}h
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Entries */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Recent Entries</h2>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            {recentEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary-500 rounded-full" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {entry.description || 'No description'}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{entry.customerName}</span>
                        <span>•</span>
                        <span>{format(new Date(entry.date), 'MMM d')}</span>
                        <span>•</span>
                        <span className={`status-badge status-${entry.status}`}>
                          {entry.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {safeNumber(entry.hours).toFixed(1)}h
                  </p>
                  <p className="text-xs text-gray-500">{entry.userName}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Monthly Trend</h2>
        </div>
        <div className="card-body">
          <div className="space-y-3">
            {monthlyTrend.map((month) => (
              <div key={month.month} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    {format(new Date(month.month), 'MMM yyyy')}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {month.totalHours.toFixed(1)}h
                  </p>
                  <p className="text-xs text-gray-500">{month.entryCount} entries</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 