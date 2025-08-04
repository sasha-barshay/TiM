import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import { useOfflineStore } from './stores/offlineStore';

// Layout components
import Layout from './components/layout/Layout';
import MobileLayout from './components/layout/MobileLayout';

// Auth components
import Login from './components/auth/Login';
import InviteAccept from './components/auth/InviteAccept';

// Screen components
import Dashboard from './components/screens/Dashboard';
import TimeEntries from './components/screens/TimeEntries';
import Customers from './components/screens/Customers';
import Reports from './components/screens/Reports';
import Profile from './components/screens/Profile';

// Admin components
import UserManagement from './components/admin/UserManagement';

// Loading component
import LoadingSpinner from './components/common/LoadingSpinner';

// Styles
import './index.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
  },
});

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Admin Route component
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.roles.includes('admin')) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  console.log('🎨 App component rendering...');
  
  const { initializeAuth } = useAuthStore();
  const { initializeOffline } = useOfflineStore();

  // Initialize auth and offline functionality
  React.useEffect(() => {
    console.log('🔧 Initializing auth and offline...');
    initializeAuth();
    initializeOffline();
  }, [initializeAuth, initializeOffline]);

  // Simple test render to see if React is working
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <div style={{ 
            position: 'fixed', 
            top: '50px', 
            left: '10px', 
            background: 'green', 
            color: 'white', 
            padding: '10px', 
            zIndex: 9999,
            fontFamily: 'monospace'
          }}>
            React App Rendered ✅
          </div>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/invite" element={<InviteAccept />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MobileLayout>
                    <Dashboard />
                  </MobileLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <MobileLayout>
                    <Dashboard />
                  </MobileLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/time-entries"
              element={
                <ProtectedRoute>
                  <MobileLayout>
                    <TimeEntries />
                  </MobileLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/customers"
              element={
                <ProtectedRoute>
                  <MobileLayout>
                    <Customers />
                  </MobileLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <MobileLayout>
                    <Reports />
                  </MobileLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <MobileLayout>
                    <Profile />
                  </MobileLayout>
                </ProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <Layout>
                    <UserManagement />
                  </Layout>
                </AdminRoute>
              }
            />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>

          {/* Global toast notifications */}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
                fontSize: '14px',
                padding: '12px 16px',
                borderRadius: '8px',
                maxWidth: '90vw',
              },
              success: {
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App; 