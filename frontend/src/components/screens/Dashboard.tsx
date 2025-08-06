import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { reportsApi } from '../../services/api';
import {
  Clock,
  DollarSign,
  TrendingUp,
  Activity,
  BarChart3,
  ArrowDown,
  Filter,
} from 'lucide-react';
import { DashboardData } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const currentMonth = new Date();
  
  const getDateRange = (period: string) => {
    switch (period) {
      case 'current':
        return {
          startDate: format(startOfMonth(currentMonth), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(currentMonth), 'yyyy-MM-dd'),
        };
      case 'previous':
        const prevMonth = subMonths(currentMonth, 1);
        return {
          startDate: format(startOfMonth(prevMonth), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(prevMonth), 'yyyy-MM-dd'),
        };
      case 'last3months':
        const threeMonthsAgo = subMonths(currentMonth, 3);
        return {
          startDate: format(startOfMonth(threeMonthsAgo), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(currentMonth), 'yyyy-MM-dd'),
        };
      default:
        return {
          startDate: format(startOfMonth(currentMonth), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(currentMonth), 'yyyy-MM-dd'),
        };
    }
  };

  const { startDate, endDate } = getDateRange(selectedPeriod);

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

  // Prepare chart data
  const monthlyChartData = monthlyTrend?.slice(-6).map((month) => ({
    month: format(new Date(month.month), 'MMM'),
    hours: month.totalHours,
    entries: month.entryCount,
  })) || [];

  const statusChartData = statusStats?.map((stat) => ({
    name: stat.status,
    value: stat.count,
    hours: stat.hours,
    color: stat.status === 'approved' ? '#10b981' : 
           stat.status === 'submitted' ? '#f59e0b' : 
           stat.status === 'draft' ? '#6b7280' : '#ef4444',
  })) || [];

  const maxHours = Math.max(...monthlyChartData.map(d => safeNumber(d.hours)), 1);

  return (
    <div className="space-y-6">
      {/* Header with Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            {format(new Date(startDate), 'MMMM yyyy')} overview
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="form-select text-sm"
          >
            <option value="current">Current Month</option>
            <option value="previous">Previous Month</option>
            <option value="last3months">Last 3 Months</option>
          </select>
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Hours</p>
                <p className="text-2xl font-bold text-gray-900">
                  {safeNumber(summary.totalHours).toFixed(1)}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-600">+12.5%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary-600" />
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
                <div className="flex items-center space-x-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-600">+8.2%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-success-600" />
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
                <div className="flex items-center space-x-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-600">+15.3%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-warning-600" />
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
                  {(safeNumber(summary.totalHours) / 30).toFixed(1)}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  <ArrowDown className="w-3 h-3 text-red-500" />
                  <span className="text-xs text-red-600">-2.1%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-info-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-info-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Hours Chart */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Monthly Hours Trend</h2>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {monthlyChartData.map((data, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{data.month}</span>
                    <span className="text-sm font-semibold text-gray-900">{safeNumber(data.hours).toFixed(1)}h</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-primary-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${(safeNumber(data.hours) / maxHours) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status Breakdown Chart */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Status Breakdown</h2>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {statusChartData.map((stat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: stat.color }}
                    />
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {stat.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500">{safeNumber(stat.hours).toFixed(1)}h</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Top Customers with Progress Bars */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Top Customers</h2>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            {topCustomers.map((customer, index) => {
              const maxCustomerHours = Math.max(...topCustomers.map(c => safeNumber(c.totalHours)), 1);
              const percentage = (safeNumber(customer.totalHours) / maxCustomerHours) * 100;
              
              return (
                <div key={customer.id} className="space-y-2">
                  <div className="flex items-center justify-between">
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
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Enhanced Recent Entries Timeline */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            {recentEntries.map((entry, index) => (
              <div key={entry.id} className="relative">
                {index < recentEntries.length - 1 && (
                  <div className="absolute left-4 top-8 w-0.5 h-8 bg-gray-200" />
                )}
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Activity className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {entry.description || 'No description'}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className={`status-badge status-${entry.status}`}>
                          {entry.status}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {safeNumber(entry.hours).toFixed(1)}h
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                                              <span>{entry.customer_name}</span>
                      <span>•</span>
                      <span>{format(new Date(entry.date), 'MMM d, yyyy')}</span>
                      <span>•</span>
                                              <span>{entry.user_name}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 gap-4">
            <button className="btn btn-primary flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Log Time</span>
            </button>
            <button className="btn btn-outline flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>View Reports</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 