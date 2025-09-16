import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { useAuthStore } from '../stores/authStore';
import {
  UserProfile,
  AuthResponse,
  LoginCredentials,

  Customer,
  TimeEntry,
  TimeEntryFormData,
  CustomerFormData,
  DashboardData,
  TimeEntriesReport,
  CustomerReport,
  Invitation,
  User,
  UserFormData,
  PaginatedResponse,

} from '../types';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { refreshToken } = useAuthStore.getState();
        if (refreshToken) {
          await authApi.refreshToken(refreshToken);
          useAuthStore.getState().refreshAuth();
          return api(originalRequest);
        }
      } catch (refreshError) {
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);



// Auth API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/login', credentials);
    return response.data;
  },

  loginWithGoogle: async (idToken: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/google', { idToken });
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/refresh', { refreshToken });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/api/auth/logout');
  },

  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get<{ user: UserProfile }>('/api/auth/profile');
    return response.data.user;
  },
};

// Users API
export const usersApi = {
  getUsers: async (params?: { limit?: number; offset?: number }): Promise<PaginatedResponse<User>> => {
    const response = await api.get<{ users: User[]; pagination: any }>('/api/users', { params });
    return {
      data: response.data.users,
      pagination: response.data.pagination,
    };
  },

  getUser: async (userId: string): Promise<User> => {
    const response = await api.get<{ user: User }>(`/api/users/${userId}`);
    return response.data.user;
  },

  createInvitation: async (data: { email: string; roles: string[] }): Promise<Invitation> => {
    const response = await api.post<{ invitation: Invitation }>('/api/users/invite', data);
    return response.data.invitation;
  },

  getInvitations: async (): Promise<Invitation[]> => {
    const response = await api.get<{ invitations: Invitation[] }>('/api/users/invitations');
    return response.data.invitations;
  },

  acceptInvitation: async (data: { token: string; name: string; password: string }): Promise<void> => {
    await api.post('/api/users/invite/accept', data);
  },

  updateUser: async (userId: string, data: Partial<UserFormData>): Promise<User> => {
    const response = await api.put<{ user: User }>(`/users/${userId}`, data);
    return response.data.user;
  },

  deleteUser: async (userId: string): Promise<void> => {
    await api.delete(`/users/${userId}`);
  },
};

// Working Schedules API
export const workingSchedulesApi = {
  getWorkingSchedules: async (params?: {
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResponse<any>> => {
    const response = await api.get<{ schedules: any[]; pagination: any }>('/api/working-schedules', { params });
    return {
      data: response.data.schedules,
      pagination: response.data.pagination,
    };
  },

  getWorkingSchedule: async (scheduleId: string): Promise<any> => {
    const response = await api.get<{ schedule: any }>(`/working-schedules/${scheduleId}`);
    return response.data.schedule;
  },

  createWorkingSchedule: async (data: any): Promise<any> => {
    const response = await api.post<{ schedule: any }>('/api/working-schedules', data);
    return response.data.schedule;
  },

  updateWorkingSchedule: async (scheduleId: string, data: any): Promise<any> => {
    const response = await api.put<{ schedule: any }>(`/working-schedules/${scheduleId}`, data);
    return response.data.schedule;
  },

  deleteWorkingSchedule: async (scheduleId: string): Promise<void> => {
    await api.delete(`/working-schedules/${scheduleId}`);
  },

  getTimezones: async (): Promise<string[]> => {
    const response = await api.get<{ timezones: string[] }>('/api/working-schedules/timezones/list');
    return response.data.timezones;
  },
};

// Customers API
export const customersApi = {
  getCustomers: async (params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResponse<Customer>> => {
    const response = await api.get<{ customers: Customer[]; pagination: any }>('/api/customers', { params });
    return {
      data: response.data.customers,
      pagination: response.data.pagination,
    };
  },

  getCustomer: async (customerId: string): Promise<Customer> => {
    const response = await api.get<{ customer: Customer }>(`/customers/${customerId}`);
    return response.data.customer;
  },

  createCustomer: async (data: CustomerFormData): Promise<Customer> => {
    const response = await api.post<{ customer: Customer }>('/api/customers', data);
    return response.data.customer;
  },

  updateCustomer: async (customerId: string, data: Partial<CustomerFormData>): Promise<Customer> => {
    const response = await api.put<{ customer: Customer }>(`/customers/${customerId}`, data);
    return response.data.customer;
  },

  deleteCustomer: async (customerId: string): Promise<void> => {
    await api.delete(`/customers/${customerId}`);
  },

  getCustomerStats: async (customerId: string, params?: { startDate?: string; endDate?: string }): Promise<any> => {
    const response = await api.get(`/customers/${customerId}/stats`, { params });
    return response.data;
  },
};

// Time Entries API
export const timeEntriesApi = {
  getTimeEntries: async (params?: {
    startDate?: string;
    endDate?: string;
    customerId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<TimeEntriesReport> => {
    const response = await api.get<TimeEntriesReport>('/api/time-entries', { params });
    return response.data;
  },

  getTimeEntry: async (timeEntryId: string): Promise<TimeEntry> => {
    const response = await api.get<{ timeEntry: TimeEntry }>(`/time-entries/${timeEntryId}`);
    return response.data.timeEntry;
  },

  createTimeEntry: async (data: TimeEntryFormData): Promise<TimeEntry> => {
    const response = await api.post<{ timeEntry: TimeEntry }>('/api/time-entries', data);
    return response.data.timeEntry;
  },

  createQuickTimeEntry: async (data: { customerId: string; hours: number; description?: string }): Promise<TimeEntry> => {
    const response = await api.post<{ timeEntry: TimeEntry }>('/api/time-entries/quick', data);
    return response.data.timeEntry;
  },

  updateTimeEntry: async (timeEntryId: string, data: Partial<TimeEntryFormData>): Promise<TimeEntry> => {
    const response = await api.put<{ timeEntry: TimeEntry }>(`/time-entries/${timeEntryId}`, data);
    return response.data.timeEntry;
  },

  deleteTimeEntry: async (timeEntryId: string): Promise<void> => {
    await api.delete(`/time-entries/${timeEntryId}`);
  },

  syncOfflineEntries: async (entries: any[]): Promise<any> => {
    const response = await api.post('/api/time-entries/sync', { entries });
    return response.data;
  },
};

// Reports API
export const reportsApi = {
  getDashboard: async (params?: { startDate?: string; endDate?: string }): Promise<DashboardData> => {
    const response = await api.get<{ dashboard: DashboardData }>('/api/reports/dashboard', { params });
    return response.data.dashboard;
  },

  getTimeEntriesReport: async (params?: {
    startDate?: string;
    endDate?: string;
    customerId?: string;
    userId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<TimeEntriesReport> => {
    const response = await api.get<TimeEntriesReport>('/api/reports/time-entries', { params });
    return response.data;
  },

  exportTimeEntries: async (params?: {
    startDate?: string;
    endDate?: string;
    customerId?: string;
    userId?: string;
    status?: string;
  }): Promise<Blob> => {
    const response = await api.get('/api/reports/time-entries/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  getCustomerReport: async (
    customerId: string,
    params?: { startDate?: string; endDate?: string }
  ): Promise<CustomerReport> => {
    const response = await api.get<CustomerReport>(`/reports/customers/${customerId}`, { params });
    return response.data;
  },
};

// Sync API
export const syncApi = {
  getSyncStatus: async (): Promise<any> => {
    const response = await api.get('/api/sync/status');
    return response.data;
  },
};

// Health check
export const healthApi = {
  check: async (): Promise<{ status: string; timestamp: string; version: string }> => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;