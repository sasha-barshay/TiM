import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { Plus, Clock, Filter } from 'lucide-react';
import { timeEntriesApi, customersApi } from '../../services/api';
import { TimeEntry, Customer, TimeEntryFormData } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const TimeEntries: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [filters, setFilters] = useState({
    customerId: '',
    status: '',
    startDate: format(startOfWeek(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfWeek(new Date()), 'yyyy-MM-dd'),
  });

  const queryClient = useQueryClient();

  // Fetch time entries
  const { data: timeEntriesData, isLoading: entriesLoading } = useQuery({
    queryKey: ['timeEntries', filters],
    queryFn: () => {
      // Filter out empty parameters to avoid validation errors
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );
      return timeEntriesApi.getTimeEntries(cleanFilters);
    },
  });

  // Fetch customers for dropdown
  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.getCustomers(),
  });

  // Create time entry mutation
  const createMutation = useMutation({
    mutationFn: (data: TimeEntryFormData) => timeEntriesApi.createTimeEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
      setShowForm(false);
      setSelectedEntry(null);
      toast.success('Time entry created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create time entry');
    },
  });

  // Update time entry mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TimeEntryFormData> }) =>
      timeEntriesApi.updateTimeEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
      setShowForm(false);
      setSelectedEntry(null);
      toast.success('Time entry updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update time entry');
    },
  });

  // Generate calendar days
  const weekDays = eachDayOfInterval({
    start: startOfWeek(selectedDate),
    end: endOfWeek(selectedDate),
  });

  // Get entries for a specific date
  const getEntriesForDate = (date: Date) => {
    if (!timeEntriesData?.timeEntries) return [];
    return timeEntriesData.timeEntries.filter((entry: TimeEntry) =>
      isSameDay(parseISO(entry.date), date)
    );
  };

  // Handle form submission
  const handleSubmit = (formData: TimeEntryFormData) => {
    if (selectedEntry) {
      updateMutation.mutate({ id: selectedEntry.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (entriesLoading || customersLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" text="Loading time entries..." />
      </div>
    );
  }

  const timeEntries = timeEntriesData?.timeEntries || [];
  const customers = customersData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Time Entries</h1>
          <p className="text-gray-600">Track your work hours and activities</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Log Time</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            
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
          </div>
        </div>
      </div>

      {/* Calendar View */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Weekly Calendar</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center py-2 text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {weekDays.map((day) => {
              const dayEntries = getEntriesForDate(day);
              const isToday = isSameDay(day, new Date());
              const isSelected = isSameDay(day, selectedDate);

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    min-h-24 p-2 border rounded-lg cursor-pointer transition-colors
                    ${isToday ? 'bg-primary-50 border-primary-200' : 'bg-white border-gray-200'}
                    ${isSelected ? 'ring-2 ring-primary-500' : ''}
                    hover:bg-gray-50
                  `}
                >
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    {format(day, 'd')}
                  </div>
                  
                  {dayEntries.length > 0 && (
                    <div className="space-y-1">
                                             {dayEntries.slice(0, 2).map((entry: TimeEntry) => (
                        <div
                          key={entry.id}
                          className="text-xs p-1 bg-primary-100 text-primary-700 rounded truncate"
                          title={`${entry.customerName}: ${entry.hours}h - ${entry.description}`}
                        >
                          {entry.customerName}: {entry.hours}h
                        </div>
                      ))}
                      {dayEntries.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{dayEntries.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Time Entries List */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Time Entries</h2>
        </div>
        <div className="card-body">
          {timeEntries.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No time entries found for the selected period</p>
            </div>
          ) : (
            <div className="space-y-4">
              {timeEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
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
                          <span>{format(parseISO(entry.date), 'MMM d, yyyy')}</span>
                          <span>•</span>
                          <span className={`status-badge status-${entry.status}`}>
                            {entry.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {(Number(entry.hours) || 0).toFixed(1)}h
                      </p>
                      <p className="text-xs text-gray-500">{entry.userName}</p>
                    </div>
                    
                    <button
                      onClick={() => {
                        setSelectedEntry(entry);
                        setShowForm(true);
                      }}
                      className="btn btn-sm btn-outline"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Time Entry Form Modal */}
      {showForm && (
        <TimeEntryForm
          entry={selectedEntry}
          customers={customers}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setSelectedEntry(null);
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
};

// Time Entry Form Component
interface TimeEntryFormProps {
  entry: TimeEntry | null;
  customers: Customer[];
  onSubmit: (data: TimeEntryFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const TimeEntryForm: React.FC<TimeEntryFormProps> = ({
  entry,
  customers,
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const [formData, setFormData] = useState<TimeEntryFormData>({
    customerId: entry?.customerId || '',
    date: entry?.date || format(new Date(), 'yyyy-MM-dd'),
    hours: entry?.hours || 0,
    startTime: entry?.startTime || '',
    endTime: entry?.endTime || '',
    description: entry?.description || '',
    status: entry?.status || 'draft',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.customerId) {
      toast.error('Please select a customer');
      return;
    }
    
    if (!formData.hours && (!formData.startTime || !formData.endTime)) {
      toast.error('Please enter either hours or start/end times');
      return;
    }
    
    if ((formData.hours || 0) < 0.5) {
      toast.error('Minimum time entry is 0.5 hours');
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {entry ? 'Edit Time Entry' : 'Log Time Entry'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Customer</label>
            <select
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              className="form-select"
              required
            >
              <option value="">Select Customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="form-input"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Start Time</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">End Time</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Hours (or leave empty to calculate from times)</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              value={formData.hours}
              onChange={(e) => setFormData({ ...formData, hours: parseFloat(e.target.value) || 0 })}
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="form-textarea"
              rows={3}
              placeholder="Describe the work performed..."
            />
          </div>

          <div>
            <label className="form-label">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="form-select"
            >
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-outline"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : (entry ? 'Update' : 'Save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TimeEntries; 