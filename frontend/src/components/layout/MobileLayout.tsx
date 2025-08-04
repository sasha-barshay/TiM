import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useOfflineStore } from '../../stores/offlineStore';
import {
  Home,
  Clock,
  Users,
  BarChart3,
  User,
  Plus,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface MobileLayoutProps {
  children: React.ReactNode;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { isOnline, syncStatus, syncOfflineEntries } = useOfflineStore();

  // Navigation items based on user roles
  const navigationItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: Home,
      roles: ['admin', 'account_manager', 'engineer'],
    },
    {
      label: 'Time Entries',
      path: '/time-entries',
      icon: Clock,
      roles: ['admin', 'account_manager', 'engineer'],
    },
    {
      label: 'Customers',
      path: '/customers',
      icon: Users,
      roles: ['admin', 'account_manager'],
    },
    {
      label: 'Reports',
      path: '/reports',
      icon: BarChart3,
      roles: ['admin', 'account_manager'],
    },
    {
      label: 'Profile',
      path: '/profile',
      icon: User,
      roles: ['admin', 'account_manager', 'engineer'],
    },
  ];

  // Filter navigation items based on user roles
  const filteredNavigationItems = navigationItems.filter((item) =>
    item.roles.some((role) => user?.roles.includes(role))
  );

  const handleQuickTimeEntry = () => {
    navigate('/time-entries/new');
  };

  const handleSync = async () => {
    try {
      await syncOfflineEntries();
      toast.success('Entries synced successfully');
    } catch (error) {
      toast.error('Failed to sync entries');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="mobile-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">TiM</h1>
              <p className="text-xs text-gray-500">Time is Money</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Online/Offline indicator */}
            <div className="flex items-center space-x-1">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-success-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-danger-500" />
              )}
            </div>

            {/* Sync status */}
            {syncStatus.pendingChanges > 0 && (
              <button
                onClick={handleSync}
                className="p-1 rounded-full bg-primary-100 text-primary-600 hover:bg-primary-200 transition-colors"
                title={`${syncStatus.pendingChanges} entries to sync`}
              >
                <RefreshCw className={`w-4 h-4 ${syncStatus.status === 'syncing' ? 'animate-spin' : ''}`} />
              </button>
            )}

            {/* User menu */}
            <div className="relative">
              <button
                onClick={handleLogout}
                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                title="Logout"
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Offline indicator */}
      {!isOnline && (
        <div className="offline-indicator">
          <div className="flex items-center justify-between">
            <span>You're offline</span>
            {syncStatus.pendingChanges > 0 && (
              <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">
                {syncStatus.pendingChanges} pending
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="mobile-content">
        {children}
      </main>

      {/* Floating Action Button for Quick Time Entry */}
      {location.pathname === '/time-entries' && (
        <button
          onClick={handleQuickTimeEntry}
          className="fab"
          title="Quick time entry"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <div className="grid grid-cols-5 gap-1">
          {filteredNavigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Safe area for devices with home indicator */}
      <div className="h-safe-area-inset-bottom bg-white" />
    </div>
  );
};

export default MobileLayout; 