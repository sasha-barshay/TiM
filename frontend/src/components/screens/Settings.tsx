import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Globe, 
  Settings as SettingsIcon,
  Calendar,
  Filter,
  Search
} from 'lucide-react';
import { workingSchedulesApi } from '../../services/api';
import { WorkingSchedule } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<WorkingSchedule | null>(null);
  const [filters, setFilters] = useState({
    search: '',
  });

  const queryClient = useQueryClient();

  // Fetch working schedules
  const { data: schedulesData, isLoading: schedulesLoading } = useQuery({
    queryKey: ['workingSchedules', filters],
    queryFn: () => workingSchedulesApi.getWorkingSchedules(),
  });

  // Fetch timezones
  const { data: timezones, isLoading: timezonesLoading } = useQuery({
    queryKey: ['timezones'],
    queryFn: () => workingSchedulesApi.getTimezones(),
  });

  // Create schedule mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => workingSchedulesApi.createWorkingSchedule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workingSchedules'] });
      setShowForm(false);
      toast.success('Working schedule created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create working schedule');
    },
  });

  // Update schedule mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      workingSchedulesApi.updateWorkingSchedule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workingSchedules'] });
      setShowForm(false);
      setSelectedSchedule(null);
      toast.success('Working schedule updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update working schedule');
    },
  });

  // Delete schedule mutation
  const deleteMutation = useMutation({
    mutationFn: (scheduleId: string) => workingSchedulesApi.deleteWorkingSchedule(scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workingSchedules'] });
      toast.success('Working schedule deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete working schedule');
    },
  });

  if (schedulesLoading || timezonesLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" text="Loading settings..." />
      </div>
    );
  }

  const schedules = schedulesData?.data || [];
  const timezoneList = timezones || [];

  // Filter schedules based on search
  const filteredSchedules = schedules.filter((schedule: WorkingSchedule) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        schedule.name.toLowerCase().includes(searchLower) ||
        schedule.timezone.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const handleSubmit = (formData: any) => {
    if (selectedSchedule) {
      updateMutation.mutate({ id: selectedSchedule.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (schedule: WorkingSchedule) => {
    if (confirm(`Are you sure you want to delete "${schedule.name}"?`)) {
      deleteMutation.mutate(schedule.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage working schedule templates and system preferences</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Schedule</span>
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
            
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search schedules..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="form-input pl-10"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Working Schedules List */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Working Schedule Templates</h2>
        </div>
        <div className="card-body">
          {filteredSchedules.length === 0 ? (
            <div className="text-center py-12">
              <SettingsIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No working schedules found</p>
              <p className="text-sm text-gray-400">
                {filters.search ? 'Try adjusting your search' : 'Get started by creating your first working schedule template'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Schedule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timezone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Working Days
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSchedules.map((schedule: WorkingSchedule) => (
                    <tr key={schedule.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-primary-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{schedule.name}</div>
                            <div className="text-sm text-gray-500">
                              Created {format(new Date(schedule.createdAt), 'MMM d, yyyy')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Globe className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{schedule.timezone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {schedule.scheduleConfig.workingDays.filter(day => day.isWorkingDay).length} days
                        </div>
                        <div className="text-xs text-gray-500">
                          {schedule.scheduleConfig.workingDays
                            .filter(day => day.isWorkingDay)
                            .map(day => day.day.substring(0, 3))
                            .join(', ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{schedule.createdByName || 'Unknown'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedSchedule(schedule);
                              setShowForm(true);
                            }}
                            className="btn btn-sm btn-outline"
                            title="Edit Schedule"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(schedule)}
                            className="btn btn-sm btn-outline text-red-600 hover:text-red-700"
                            title="Delete Schedule"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Form Modal */}
      {showForm && (
        <WorkingScheduleForm
          schedule={selectedSchedule}
          timezones={timezoneList}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setSelectedSchedule(null);
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
};

// Working Schedule Form Component
interface WorkingScheduleFormProps {
  schedule: WorkingSchedule | null;
  timezones: string[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const WorkingScheduleForm: React.FC<WorkingScheduleFormProps> = ({
  schedule,
  timezones,
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    name: schedule?.name || '',
    timezone: schedule?.timezone || 'UTC',
    scheduleConfig: schedule?.scheduleConfig || {
      workingDays: [
        { day: 'Monday', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
        { day: 'Tuesday', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
        { day: 'Wednesday', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
        { day: 'Thursday', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
        { day: 'Friday', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
        { day: 'Saturday', startTime: '09:00', endTime: '17:00', isWorkingDay: false },
        { day: 'Sunday', startTime: '09:00', endTime: '17:00', isWorkingDay: false },
      ],
      breakTime: {
        startTime: '12:00',
        endTime: '13:00',
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Schedule name is required');
      return;
    }

    if (!formData.scheduleConfig.workingDays.some(day => day.isWorkingDay)) {
      toast.error('At least one working day must be selected');
      return;
    }

    onSubmit(formData);
  };

  const handleDayToggle = (dayIndex: number) => {
    const updatedDays = [...formData.scheduleConfig.workingDays];
    updatedDays[dayIndex].isWorkingDay = !updatedDays[dayIndex].isWorkingDay;
    
    setFormData(prev => ({
      ...prev,
      scheduleConfig: {
        ...prev.scheduleConfig,
        workingDays: updatedDays,
      },
    }));
  };

  const handleDayTimeChange = (dayIndex: number, field: 'startTime' | 'endTime', value: string) => {
    const updatedDays = [...formData.scheduleConfig.workingDays];
    updatedDays[dayIndex][field] = value;
    
    setFormData(prev => ({
      ...prev,
      scheduleConfig: {
        ...prev.scheduleConfig,
        workingDays: updatedDays,
      },
    }));
  };

  const handleBreakTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    setFormData(prev => ({
      ...prev,
      scheduleConfig: {
        ...prev.scheduleConfig,
        breakTime: {
          startTime: field === 'startTime' ? value : (prev.scheduleConfig.breakTime?.startTime || ''),
          endTime: field === 'endTime' ? value : (prev.scheduleConfig.breakTime?.endTime || ''),
        },
      },
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {schedule ? 'Edit Working Schedule' : 'Create Working Schedule'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Basic Information</h4>
            <div className="space-y-4">
              <div>
                <label className="form-label">Schedule Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  required
                  placeholder="e.g., Standard 9-5, Flexible Hours"
                />
              </div>

              <div>
                <label className="form-label">Timezone</label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="form-select"
                >
                  {timezones.map(timezone => (
                    <option key={timezone} value={timezone}>{timezone}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Working Days Configuration */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Working Days</h4>
            <div className="space-y-3">
              {formData.scheduleConfig.workingDays.map((day, index) => (
                <div key={day.day} className="flex items-center space-x-4 p-3 border rounded-lg">
                  <label className="flex items-center space-x-3 flex-1">
                    <input
                      type="checkbox"
                      checked={day.isWorkingDay}
                      onChange={() => handleDayToggle(index)}
                      className="form-checkbox"
                    />
                    <span className="text-sm font-medium text-gray-900 w-20">{day.day}</span>
                  </label>
                  
                  {day.isWorkingDay && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="time"
                        value={day.startTime}
                        onChange={(e) => handleDayTimeChange(index, 'startTime', e.target.value)}
                        className="form-input w-24"
                      />
                      <span className="text-sm text-gray-500">to</span>
                      <input
                        type="time"
                        value={day.endTime}
                        onChange={(e) => handleDayTimeChange(index, 'endTime', e.target.value)}
                        className="form-input w-24"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Break Time Configuration */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Break Time</h4>
            <div className="flex items-center space-x-4">
              <div>
                <label className="form-label">Start Time</label>
                <input
                  type="time"
                  value={formData.scheduleConfig.breakTime?.startTime || ''}
                  onChange={(e) => handleBreakTimeChange('startTime', e.target.value)}
                  className="form-input w-32"
                />
              </div>
              <div>
                <label className="form-label">End Time</label>
                <input
                  type="time"
                  value={formData.scheduleConfig.breakTime?.endTime || ''}
                  onChange={(e) => handleBreakTimeChange('endTime', e.target.value)}
                  className="form-input w-32"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
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
              {isLoading ? 'Saving...' : (schedule ? 'Update Schedule' : 'Create Schedule')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings; 