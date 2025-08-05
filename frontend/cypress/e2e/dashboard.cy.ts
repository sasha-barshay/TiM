describe('Dashboard E2E Tests', () => {
  beforeEach(() => {
    // Mock authentication and API responses
    cy.intercept('GET', '/api/auth/profile', {
      statusCode: 200,
      body: {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin'
      }
    }).as('getProfile');

    cy.intercept('GET', '/api/reports/dashboard*', {
      statusCode: 200,
      body: {
        summary: {
          totalHours: 120.5,
          totalEarnings: 12050,
          totalEntries: 45
        },
        statusStats: [
          { status: 'approved', count: 30, hours: 80.5 },
          { status: 'submitted', count: 10, hours: 25.0 },
          { status: 'draft', count: 5, hours: 15.0 }
        ],
        topCustomers: [
          { id: '1', name: 'Acme Corp', totalHours: 45.5, entryCount: 15 },
          { id: '2', name: 'TechStart', totalHours: 32.0, entryCount: 12 }
        ],
        recentEntries: [
          {
            id: '1',
            description: 'Frontend development',
            customerName: 'Acme Corp',
            userName: 'John Doe',
            date: '2024-01-15',
            hours: 8.0,
            status: 'approved'
          }
        ],
        monthlyTrend: [
          { month: '2024-01', totalHours: 120.5, entryCount: 45 },
          { month: '2023-12', totalHours: 110.0, entryCount: 42 }
        ]
      }
    }).as('getDashboard');

    // Visit the dashboard page
    cy.visit('/dashboard');
  });

  it('should load dashboard with all components', () => {
    // Wait for API calls to complete
    cy.wait('@getProfile');
    cy.wait('@getDashboard');

    // Check if dashboard header is displayed
    cy.get('h1').should('contain', 'Dashboard');
    cy.get('p').should('contain', 'overview');

    // Check if summary cards are displayed
    cy.get('[data-testid="summary-card"]').should('have.length', 4);
    cy.contains('Total Hours').should('be.visible');
    cy.contains('120.5').should('be.visible');
    cy.contains('Earnings').should('be.visible');
    cy.contains('$12,050').should('be.visible');
    cy.contains('Entries').should('be.visible');
    cy.contains('45').should('be.visible');
    cy.contains('Avg/Day').should('be.visible');
    cy.contains('4.0').should('be.visible');
  });

  it('should display period selector with correct options', () => {
    cy.wait('@getProfile');
    cy.wait('@getDashboard');

    // Check period selector
    cy.get('select').should('be.visible');
    cy.get('select').should('have.value', 'current');
    cy.get('select option').should('have.length', 3);
    cy.get('select option').first().should('contain', 'Current Month');
    cy.get('select option').eq(1).should('contain', 'Previous Month');
    cy.get('select option').last().should('contain', 'Last 3 Months');
  });

  it('should change period when selector is updated', () => {
    cy.wait('@getProfile');
    cy.wait('@getDashboard');

    // Change period to previous month
    cy.get('select').select('previous');
    cy.get('select').should('have.value', 'previous');

    // Verify API call is made with new parameters
    cy.wait('@getDashboard');
  });

  it('should display monthly hours trend chart', () => {
    cy.wait('@getProfile');
    cy.wait('@getDashboard');

    // Check chart section
    cy.contains('Monthly Hours Trend').should('be.visible');
    cy.contains('Jan').should('be.visible');
    cy.contains('120.5h').should('be.visible');
    cy.contains('Dec').should('be.visible');
    cy.contains('110.0h').should('be.visible');

    // Check progress bars
    cy.get('.bg-primary-500').should('have.length.at.least', 2);
  });

  it('should display status breakdown chart', () => {
    cy.wait('@getProfile');
    cy.wait('@getDashboard');

    // Check status breakdown
    cy.contains('Status Breakdown').should('be.visible');
    cy.contains('approved').should('be.visible');
    cy.contains('submitted').should('be.visible');
    cy.contains('draft').should('be.visible');

    // Check status counts
    cy.contains('30').should('be.visible'); // approved count
    cy.contains('10').should('be.visible'); // submitted count
    cy.contains('5').should('be.visible'); // draft count
  });

  it('should display top customers with progress bars', () => {
    cy.wait('@getProfile');
    cy.wait('@getDashboard');

    // Check top customers section
    cy.contains('Top Customers').should('be.visible');
    cy.contains('Acme Corp').should('be.visible');
    cy.contains('45.5h').should('be.visible');
    cy.contains('TechStart').should('be.visible');
    cy.contains('32.0h').should('be.visible');

    // Check progress bars
    cy.get('.bg-primary-500').should('have.length.at.least', 2);
  });

  it('should display recent activity timeline', () => {
    cy.wait('@getProfile');
    cy.wait('@getDashboard');

    // Check recent activity section
    cy.contains('Recent Activity').should('be.visible');
    cy.contains('Frontend development').should('be.visible');
    cy.contains('Acme Corp').should('be.visible');
    cy.contains('8.0h').should('be.visible');
    cy.contains('John Doe').should('be.visible');
    cy.contains('Jan 15, 2024').should('be.visible');
  });

  it('should display quick action buttons', () => {
    cy.wait('@getProfile');
    cy.wait('@getDashboard');

    // Check quick actions section
    cy.contains('Quick Actions').should('be.visible');
    cy.contains('Log Time').should('be.visible');
    cy.contains('View Reports').should('be.visible');

    // Check buttons are clickable
    cy.contains('Log Time').should('be.enabled');
    cy.contains('View Reports').should('be.enabled');
  });

  it('should show percentage changes in summary cards', () => {
    cy.wait('@getProfile');
    cy.wait('@getDashboard');

    // Check percentage indicators
    cy.contains('+12.5%').should('be.visible');
    cy.contains('+8.2%').should('be.visible');
    cy.contains('+15.3%').should('be.visible');
    cy.contains('-2.1%').should('be.visible');
  });

  it('should handle loading state', () => {
    // Mock slow API response
    cy.intercept('GET', '/api/reports/dashboard*', {
      statusCode: 200,
      body: {},
      delay: 2000
    }).as('getSlowDashboard');

    cy.visit('/dashboard');
    cy.wait('@getProfile');

    // Check loading state
    cy.contains('Loading dashboard...').should('be.visible');
  });

  it('should handle error state', () => {
    // Mock API error
    cy.intercept('GET', '/api/reports/dashboard*', {
      statusCode: 500,
      body: { message: 'Internal server error' }
    }).as('getDashboardError');

    cy.visit('/dashboard');
    cy.wait('@getProfile');
    cy.wait('@getDashboardError');

    // Check error state
    cy.contains('Failed to load dashboard data').should('be.visible');
  });

  it('should be responsive on mobile devices', () => {
    cy.wait('@getProfile');
    cy.wait('@getDashboard');

    // Test mobile viewport
    cy.viewport('iphone-x');
    
    // Check if layout adapts to mobile
    cy.get('h1').should('be.visible');
    cy.get('select').should('be.visible');
    
    // Check if cards stack properly
    cy.get('[data-testid="summary-card"]').should('have.length', 4);
    
    // Check if charts are still visible
    cy.contains('Monthly Hours Trend').should('be.visible');
    cy.contains('Status Breakdown').should('be.visible');
  });

  it('should navigate to other pages from quick actions', () => {
    cy.wait('@getProfile');
    cy.wait('@getDashboard');

    // Mock time entries page
    cy.intercept('GET', '/api/time-entries*', {
      statusCode: 200,
      body: { timeEntries: [], total: 0, page: 1, limit: 10 }
    }).as('getTimeEntries');

    // Mock reports page
    cy.intercept('GET', '/api/reports/time-entries*', {
      statusCode: 200,
      body: { timeEntries: [], total: 0, page: 1, limit: 10 }
    }).as('getReports');

    // Click Log Time button
    cy.contains('Log Time').click();
    cy.url().should('include', '/time-entries');
    cy.wait('@getTimeEntries');

    // Go back to dashboard
    cy.visit('/dashboard');
    cy.wait('@getProfile');
    cy.wait('@getDashboard');

    // Click View Reports button
    cy.contains('View Reports').click();
    cy.url().should('include', '/reports');
    cy.wait('@getReports');
  });
}); 