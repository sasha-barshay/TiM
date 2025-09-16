import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';
import { TimeEntryFormData, Customer } from '../../types';

interface TimeEntryFormProps {
  customers: Customer[];
  initialData?: Partial<TimeEntryFormData>;
  onSubmit: (data: TimeEntryFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const TimeEntryForm: React.FC<TimeEntryFormProps> = ({
  customers,
  initialData = {},
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<TimeEntryFormData>({
    customerId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    hours: 0,
    startTime: '',
    endTime: '',
    description: '',
    status: 'draft',
    ...initialData
  });

  // Calculate billable hours from start/end times
  const calculateBillableHours = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0;

    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);

    if (end <= start) return 0;

    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    // Round to nearest 30 minutes (0.5 hours)
    const roundedHours = Math.round(diffHours * 2) / 2;

    return roundedHours;
  };

  // Handle time change and auto-calculate hours
  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    const newFormData = { ...formData, [field]: value };

    if (field === 'startTime' || field === 'endTime') {
      const calculatedHours = calculateBillableHours(
        field === 'startTime' ? value : newFormData.startTime,
        field === 'endTime' ? value : newFormData.endTime
      );
      newFormData.hours = calculatedHours;
    }

    setFormData(newFormData);
  };

  // Set current time
  const setCurrentTime = (field: 'startTime' | 'endTime') => {
    const now = new Date();
    const timeString = now.toTimeString().slice(0, 5);
    handleTimeChange(field, timeString);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Customer
        </label>
        <select
          value={formData.customerId}
          onChange={(e) => setFormData({...formData, customerId: e.target.value})}
          className="form-select w-full"
          required
        >
          <option value="">Select customer...</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date
        </label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({...formData, date: e.target.value})}
          className="form-input w-full"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Time
          </label>
          <div className="flex">
            <input
              type="time"
              value={formData.startTime}
              onChange={(e) => handleTimeChange('startTime', e.target.value)}
              className="form-input w-full rounded-r-none"
            />
            <button
              type="button"
              onClick={() => setCurrentTime('startTime')}
              className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Now
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Time
          </label>
          <div className="flex">
            <input
              type="time"
              value={formData.endTime}
              onChange={(e) => handleTimeChange('endTime', e.target.value)}
              className="form-input w-full rounded-r-none"
            />
            <button
              type="button"
              onClick={() => setCurrentTime('endTime')}
              className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Now
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Billable Hours (or leave empty to calculate from times)
        </label>
        <input
          type="number"
          step="0.5"
          min="0"
          value={formData.hours || ''}
          onChange={(e) => setFormData({...formData, hours: parseFloat(e.target.value) || 0})}
          placeholder="Auto-calculated from times"
          className="form-input w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="What did you work on?"
          className="form-textarea w-full"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({...formData, status: e.target.value})}
          className="form-select w-full"
        >
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
        </select>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
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
          className="btn btn-primary flex items-center space-x-2"
          disabled={isLoading}
        >
          <Clock className="w-4 h-4" />
          <span>{isLoading ? 'Saving...' : 'Log Time'}</span>
        </button>
      </div>
    </form>
  );
};

export default TimeEntryForm;
