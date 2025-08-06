// User types
export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  timezone: string;
  avatar_url?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  roles: string[];
  timezone: string;
  avatar_url?: string;
  last_login_at?: string;
}

// Working Schedule types
export interface WorkingSchedule {
  id: string;
  name: string;
  timezone: string;
  scheduleConfig: {
    workingDays: Array<{
      day: string;
      startTime: string;
      endTime: string;
      isWorkingDay: boolean;
    }>;
    breakTime?: {
      startTime: string;
      endTime: string;
    };
  };
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

// Customer types
export interface Customer {
  id: string;
  name: string;
  contact_info?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  billing_info?: {
    hourly_rate?: number;
    currency?: string;
    payment_terms?: string;
  };
  assigned_user_ids: string[];
  account_manager_id?: string;
  leading_engineer_id?: string;
  working_schedule_id?: string;
  status: 'active' | 'inactive' | 'archived';
  account_manager_name?: string;
  leading_engineer_name?: string;
  working_schedule_name?: string;
  working_schedule_config?: any;
  created_at: string;
  updated_at: string;
  created_by: string;
}

// Time Entry types
export interface TimeEntry {
  id: string;
  user_id: string;
  customer_id: string;
  date: string;
  startTime?: string;
  endTime?: string;
  hours: number;
  description: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  locationData?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  attachments?: Array<{
    id: string;
    filename: string;
    url: string;
    type: string;
  }>;
  customer_name?: string;
  billing_info?: any;
  user_name?: string;
  created_at: string;
  updated_at: string;
  synced_at?: string;
}

// Invitation types
export interface Invitation {
  id: string;
  email: string;
  roles: string[];
  invited_by: string;
  token: string;
  expires_at: string;
  accepted_at?: string;
  invited_by_name?: string;
  created_at: string;
}

// Report types
export interface DashboardData {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalHours: number;
    totalEarnings: number;
    totalEntries: number;
  };
  statusStats: Array<{
    status: string;
    count: number;
    hours: number;
  }>;
  topCustomers: Array<{
    id: string;
    name: string;
    totalHours: number;
    entryCount: number;
  }>;
  recentEntries: Array<{
    id: string;
    date: string;
    hours: number;
    description: string;
    status: string;
    customerName: string;
    userName: string;
  }>;
  monthlyTrend: Array<{
    month: string;
    totalHours: number;
    entryCount: number;
  }>;
}

export interface TimeEntriesReport {
  time_entries: TimeEntry[];
  summary: {
    total_hours: number;
    total_earnings: number;
    total_entries: number;
    total_count: number;
  };
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  filters: {
    startDate?: string;
    endDate?: string;
    customerId?: string;
    userId?: string;
    status?: string;
  };
}

export interface CustomerReport {
  customer: {
    id: string;
    name: string;
    billingInfo?: any;
  };
  period: {
    startDate?: string;
    endDate?: string;
  };
  summary: {
    totalHours: number;
    totalEarnings: number;
    totalEntries: number;
    averageHoursPerEntry: number;
  };
  userStats: Array<{
    userId: string;
    userName: string;
    totalHours: number;
    totalEntries: number;
    averageHours: number;
  }>;
  statusStats: Record<string, number>;
  monthlyStats: Array<{
    month: string;
    totalHours: number;
    totalEntries: number;
    totalEarnings: number;
  }>;
  timeEntries: TimeEntry[];
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  code?: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
  expiresIn: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// Form types
export interface TimeEntryFormData {
  customerId: string;
  date: string;
  hours?: number;
  startTime?: string;
  endTime?: string;
  description: string;
  status?: string;
  locationData?: any;
  attachments?: any[];
}

export interface CustomerFormData {
  name: string;
  contact_info?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  billing_info?: {
    hourly_rate?: number;
    currency?: string;
    payment_terms?: string;
  };
  assigned_user_ids: string[];
  account_manager_id?: string;
  leading_engineer_id?: string;
  working_schedule_id?: string;
  status: string;
}

export interface UserFormData {
  name: string;
  email: string;
  roles: string[];
  timezone: string;
  password?: string;
}

// Navigation types
export interface NavigationItem {
  label: string;
  path: string;
  icon: string;
  roles?: string[];
  badge?: number;
}

// UI types
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

// Offline types
export interface OfflineEntry {
  id?: string;
  customerId: string;
  date: string;
  hours: number;
  description: string;
  synced: boolean;
  createdAt: string;
}

export interface SyncStatus {
  status: 'synced' | 'syncing' | 'error';
  lastSync: string;
  pendingChanges: number;
}

// Chart types
export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface TimeSeriesData {
  date: string;
  hours: number;
  entries: number;
  earnings: number;
} 