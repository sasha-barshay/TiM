import React from 'react';

const InviteAccept: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">T</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join TiM</h1>
          <p className="text-gray-600">Complete your account setup</p>
        </div>

        <div className="card">
          <div className="card-body p-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Invite Acceptance Coming Soon</h3>
              <p className="text-gray-500 mb-6">
                This screen will allow users to accept invitations and complete their account setup.
              </p>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Verify invitation token</p>
                <p>• Complete profile information</p>
                <p>• Set password and security</p>
                <p>• Assign pre-configured roles</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteAccept; 