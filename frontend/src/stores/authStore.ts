import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile, AuthResponse, LoginCredentials } from '../types';
import { authApi } from '../services/api';

interface AuthState {
  // State
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
  initializeAuth: () => void;
  updateProfile: (user: UserProfile) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      // Login action
      login: async (credentials: LoginCredentials) => {
        try {
          set({ isLoading: true, error: null });
          
          const response: AuthResponse = await authApi.login(credentials);
          
          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Login failed',
          });
          throw error;
        }
      },

      // Google SSO login
      loginWithGoogle: async (idToken: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const response: AuthResponse = await authApi.loginWithGoogle(idToken);
          
          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Google login failed',
          });
          throw error;
        }
      },

      // Logout action
      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      // Refresh authentication
      refreshAuth: async () => {
        const { refreshToken } = get();
        
        if (!refreshToken) {
          set({ isLoading: false, isAuthenticated: false });
          return;
        }

        try {
          const response: AuthResponse = await authApi.refreshToken(refreshToken);
          
          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          // If refresh fails, logout the user
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Initialize authentication on app start
      initializeAuth: async () => {
        const { accessToken, refreshAuth } = get();
        
        if (accessToken) {
          // Verify token is still valid
          try {
            const user = await authApi.getProfile();
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (error) {
            // Token is invalid, try to refresh
            await refreshAuth();
          }
        } else {
          set({ isLoading: false });
        }
      },

      // Update user profile
      updateProfile: (user: UserProfile) => {
        set({ user });
      },
    }),
    {
      name: 'tim-auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
); 