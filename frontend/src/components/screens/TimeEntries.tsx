import React from 'react';

const TimeEntries: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Time Entries</h1>
          <p className="text-gray-600">Track your work hours and activities</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Time Entries Coming Soon</h3>
            <p className="text-gray-500 mb-6">
              This screen will allow you to view, create, and manage your time entries with mobile-optimized features.
            </p>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Quick time entry with customer selection</p>
              <p>• Offline support for mobile use</p>
              <p>• Time tracking with start/end times</p>
              <p>• Status management (draft, submitted, approved)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeEntries; 