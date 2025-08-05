import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Download, Filter, BarChart3, PieChart, TrendingUp } from 'lucide-react';
import { reportsApi, customersApi } from '../../services/api';
import { DashboardData } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const Reports: React.FC = () => {
  const [filters, setFilters] = useState({
    startDate: format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    customerId: '',
    status: '',
  });

  // Fetch dashboard data for reports
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useQuery<DashboardData>({
    queryKey: ['dashboard', filters.startDate, filters.endDate],
    queryFn: () => reportsApi.getDashboard({ 
      startDate: filters.startDate, 
      endDate: filters.endDate 
    }),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  // Fetch time entries report
  const { data: timeEntriesReport, isLoading: entriesLoading, error: entriesError } = useQuery({
    queryKey: ['timeEntriesReport', filters],
    queryFn: () => reportsApi.getTimeEntriesReport(filters),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  // Fetch customers for filter
  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.getCustomers(),
  });

  // Handle CSV export
  const handleExport = async () => {
    try {
      const blob = await reportsApi.exportTimeEntries(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `time-entries-${filters.startDate}-to-${filters.endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  // Handle errors
  if (dashboardError || entriesError) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load reports</h3>
          <p className="text-gray-600 mb-4">Please try refreshing the page or check your connection.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn btn-primary"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (dashboardLoading || entriesLoading || customersLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" text="Loading reports..." />
      </div>
    );
  }

  const customers = customersData?.data || [];
  const timeEntries = timeEntriesReport?.timeEntries || [];
  
  // Handle nested API response structure
  const dashboard = dashboardData || {};
  const summary = dashboard.summary || {};
  const statusStats = dashboard.statusStats || [];
  const topCustomers = dashboard.topCustomers || [];
  const monthlyTrend = dashboard.monthlyTrend || [];

  // Prepare chart data
  const monthlyChartData = monthlyTrend?.map((month) => ({
    month: format(new Date(month.month), 'MMM yyyy'),
    hours: month.totalHours,
    entries: month.entryCount,
  })) || [];

  const customerChartData = topCustomers?.slice(0, 5).map((customer) => ({
    name: customer.name,
    hours: customer.totalHours,
    revenue: customer.totalHours * 100, // Default hourly rate for chart
  })) || [];

  // Check if we have any data to display
  const hasData = summary.totalHours > 0 || timeEntries.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive insights and data analysis</p>
        </div>
        <button
          onClick={handleExport}
          className="btn btn-primary flex items-center space-x-2"
          disabled={!hasData}
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Report Filters:</span>
            </div>
            
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="form-input text-sm"
            />

            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="form-input text-sm"
            />

            <select
              value={filters.customerId}
              onChange={(e) => setFilters({ ...filters, customerId: e.target.value })}
              className="form-select text-sm"
            >
              <option value="">All Customers</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="form-select text-sm"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* No Data State */}
      {!hasData && (
        <div className="card">
          <div className="card-body">
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
              <p className="text-gray-600 mb-4">
                No time entries found for the selected date range and filters.
              </p>
              <p className="text-sm text-gray-500">
                Try adjusting the date range or filters to see more data.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {hasData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Hours</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary?.totalHours?.toFixed(1) || '0.0'}
                  </p>
                </div>
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${summary?.totalEarnings?.toFixed(0) || '0'}
                  </p>
                </div>
                <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-success-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Entries</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary?.totalEntries || 0}
                  </p>
                </div>
                <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-warning-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Hours/Day</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary?.totalHours ? (summary.totalHours / 30).toFixed(1) : '0.0'}
                  </p>
                </div>
                <div className="w-10 h-10 bg-info-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-info-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      {hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Hours Chart */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Monthly Hours Trend</h2>
          </div>
          <div className="card-body">
            <div className="h-64 flex items-center justify-center">
              {monthlyChartData.length > 0 ? (
                <div className="w-full space-y-3">
                  {monthlyChartData.map((data, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-20 text-sm text-gray-600">{data.month}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-primary-500 h-4 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min((data.hours / Math.max(...monthlyChartData.map(d => d.hours))) * 100, 100)}%`
                          }}
                        />
                      </div>
                      <div className="w-16 text-sm font-medium text-gray-900">
                        {data.hours.toFixed(1)}h
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No data available for chart</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Customers Chart */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Top Customers by Hours</h2>
          </div>
          <div className="card-body">
            <div className="h-64 flex items-center justify-center">
              {customerChartData.length > 0 ? (
                <div className="w-full space-y-3">
                  {customerChartData.map((customer, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary-600">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {customer.name}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-success-500 h-2 rounded-full"
                            style={{
                              width: `${Math.min((customer.hours / Math.max(...customerChartData.map(c => c.hours))) * 100, 100)}%`
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-12 text-right">
                          {customer.hours.toFixed(1)}h
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <PieChart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No customer data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Status Breakdown */}
      {hasData && statusStats.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Status Breakdown</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {statusStats?.map((stat) => (
                <div key={stat.status} className="text-center p-4 border rounded-lg">
                  <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center status-${stat.status}`}>
                    <span className="text-lg font-bold text-white">
                      {stat.count}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {stat.status}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stat.hours?.toFixed(1) || '0.0'} hours
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Time Entries Table */}
      {hasData && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Time Entries Report</h2>
          </div>
          <div className="card-body">
            {timeEntries.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No time entries found for the selected filters</p>
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {timeEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(entry.date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.customerName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {entry.description || 'No description'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {entry.hours.toFixed(1)}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`status-badge status-${entry.status}`}>
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.userName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};

export default Reports; 