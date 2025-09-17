import React from 'react';
import { AlertCircle, Mail, UserCheck } from 'lucide-react';

interface AccessControlErrorProps {
  message: string;
  code: string;
}

const AccessControlError: React.FC<AccessControlErrorProps> = ({ message, code }) => {
  const getErrorContent = () => {
    switch (code) {
      case 'NO_CUSTOMERS_ASSIGNED':
        return {
          icon: <UserCheck className="w-12 h-12 text-blue-500" />,
          title: 'No Customers Assigned',
          description: 'You need to be assigned to at least one customer to access the application.',
          action: 'Please contact your administrator to get customer assignments.',
          contactInfo: 'Reach out to your admin or account manager for assistance.'
        };
      case 'INSUFFICIENT_PERMISSIONS':
        return {
          icon: <AlertCircle className="w-12 h-12 text-red-500" />,
          title: 'Access Denied',
          description: 'You don\'t have the required permissions to access this feature.',
          action: 'Contact your administrator for permission changes.',
          contactInfo: 'Only administrators and account managers can perform this action.'
        };
      default:
        return {
          icon: <AlertCircle className="w-12 h-12 text-yellow-500" />,
          title: 'Access Restricted',
          description: message,
          action: 'Please contact your administrator for assistance.',
          contactInfo: 'Reach out to your admin for help with access issues.'
        };
    }
  };

  const errorContent = getErrorContent();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          {errorContent.icon}
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {errorContent.title}
        </h1>
        
        <p className="text-gray-600 mb-6">
          {errorContent.description}
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Mail className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-left">
              <p className="text-sm font-medium text-blue-900 mb-1">
                What to do next:
              </p>
              <p className="text-sm text-blue-700">
                {errorContent.action}
              </p>
            </div>
          </div>
        </div>
        
        <div className="text-sm text-gray-500">
          {errorContent.contactInfo}
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={() => window.location.href = '/login'}
            className="btn btn-outline w-full"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessControlError;
