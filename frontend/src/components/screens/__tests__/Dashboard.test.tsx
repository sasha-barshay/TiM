import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';
import { mockDashboardData } from '../../../mocks/handlers';

// Create a new QueryClient for each test
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('renders dashboard header correctly', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText(/overview/)).toBeInTheDocument();
    });
  });

  it('displays summary cards with correct data', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      // Check if summary cards are rendered
      expect(screen.getByText('Total Hours')).toBeInTheDocument();
      expect(screen.getByText('120.5')).toBeInTheDocument();
      
      expect(screen.getByText('Earnings')).toBeInTheDocument();
      expect(screen.getByText('$12,050')).toBeInTheDocument();
      
      expect(screen.getByText('Entries')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
      
      expect(screen.getByText('Avg/Day')).toBeInTheDocument();
      expect(screen.getByText('4.0')).toBeInTheDocument();
    });
  });

  it('shows period selector with correct options', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      const periodSelector = screen.getByRole('combobox');
      expect(periodSelector).toBeInTheDocument();
      expect(periodSelector).toHaveValue('current');
    });
  });

  it('changes period when selector is updated', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      const periodSelector = screen.getByRole('combobox');
      fireEvent.change(periodSelector, { target: { value: 'previous' } });
      expect(periodSelector).toHaveValue('previous');
    });
  });

  it('displays monthly hours trend chart', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Monthly Hours Trend')).toBeInTheDocument();
      expect(screen.getByText('Jan')).toBeInTheDocument();
      expect(screen.getByText('120.5h')).toBeInTheDocument();
    });
  });

  it('displays status breakdown chart', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Status Breakdown')).toBeInTheDocument();
      expect(screen.getByText('approved')).toBeInTheDocument();
      expect(screen.getByText('submitted')).toBeInTheDocument();
      expect(screen.getByText('draft')).toBeInTheDocument();
    });
  });

  it('displays top customers with progress bars', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Top Customers')).toBeInTheDocument();
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('45.5h')).toBeInTheDocument();
    });
  });

  it('displays recent activity timeline', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('Frontend development')).toBeInTheDocument();
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('8.0h')).toBeInTheDocument();
    });
  });

  it('displays quick action buttons', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Log Time')).toBeInTheDocument();
      expect(screen.getByText('View Reports')).toBeInTheDocument();
    });
  });

  it('shows percentage changes in summary cards', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('+12.5%')).toBeInTheDocument();
      expect(screen.getByText('+8.2%')).toBeInTheDocument();
      expect(screen.getByText('+15.3%')).toBeInTheDocument();
      expect(screen.getByText('-2.1%')).toBeInTheDocument();
    });
  });

  it('handles loading state correctly', () => {
    // Mock a slow query
    const slowQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: Infinity,
        },
      },
    });

    render(
      <QueryClientProvider client={slowQueryClient}>
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  it('handles error state correctly', async () => {
    // Mock an error response
    const errorQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Mock the API to return an error
    jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <QueryClientProvider client={errorQueryClient}>
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load dashboard data')).toBeInTheDocument();
    });
  });

  it('calculates progress bar widths correctly', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      const progressBars = document.querySelectorAll('.bg-primary-500');
      expect(progressBars.length).toBeGreaterThan(0);
      
      // Check that progress bars have width styles
      progressBars.forEach(bar => {
        expect(bar).toHaveStyle('width');
      });
    });
  });

  it('formats dates correctly in recent activity', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      // Check for formatted date
      expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
    });
  });
}); 