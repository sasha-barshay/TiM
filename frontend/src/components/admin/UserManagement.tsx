import React from 'react';

const UserManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage team members and permissions</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">User Management Coming Soon</h3>
            <p className="text-gray-500 mb-6">
              This screen will allow administrators to manage team members, roles, and permissions.
            </p>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Invite new team members</p>
              <p>• Manage user roles and permissions</p>
              <p>• View user activity and status</p>
              <p>• Handle user invitations and onboarding</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement; 