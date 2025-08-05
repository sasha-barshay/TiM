describe('Dashboard E2E Tests', () => {
  beforeEach(() => {
    // Visit the dashboard page
    cy.visit('/dashboard');
  });

    // Visit the dashboard page
    cy.visit('/dashboard');
  });

  it('should load dashboard with all components', () => {

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

    // Check period selector
    cy.get('select').should('be.visible');
    cy.get('select').should('have.value', 'current');
    cy.get('select option').should('have.length', 3);
    cy.get('select option').first().should('contain', 'Current Month');
    cy.get('select option').eq(1).should('contain', 'Previous Month');
    cy.get('select option').last().should('contain', 'Last 3 Months');
  });

  it('should change period when selector is updated', () => {

    // Change period to previous month
    cy.get('select').select('previous');
    cy.get('select').should('have.value', 'previous');


  });

  it('should display monthly hours trend chart', () => {

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

    // Check recent activity section
    cy.contains('Recent Activity').should('be.visible');
    cy.contains('Frontend development').should('be.visible');
    cy.contains('Acme Corp').should('be.visible');
    cy.contains('8.0h').should('be.visible');
    cy.contains('John Doe').should('be.visible');
    cy.contains('Jan 15, 2024').should('be.visible');
  });

  it('should display quick action buttons', () => {

    // Check quick actions section
    cy.contains('Quick Actions').should('be.visible');
    cy.contains('Log Time').should('be.visible');
    cy.contains('View Reports').should('be.visible');

    // Check buttons are clickable
    cy.contains('Log Time').should('be.enabled');
    cy.contains('View Reports').should('be.enabled');
  });

  it('should show percentage changes in summary cards', () => {

    // Check percentage indicators
    cy.contains('+12.5%').should('be.visible');
    cy.contains('+8.2%').should('be.visible');
    cy.contains('+15.3%').should('be.visible');
    cy.contains('-2.1%').should('be.visible');
  });

  it('should handle loading state', () => {
    cy.visit('/dashboard');

    // Check loading state
    cy.contains('Loading dashboard...').should('be.visible');
  });

  it('should handle error state', () => {
    cy.visit('/dashboard');

    // Check error state
    cy.contains('Failed to load dashboard data').should('be.visible');
  });

  it('should be responsive on mobile devices', () => {

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

    // Click Log Time button
    cy.contains('Log Time').click();
    cy.url().should('include', '/time-entries');

    // Go back to dashboard
    cy.visit('/dashboard');

    // Click View Reports button
    cy.contains('View Reports').click();
    cy.url().should('include', '/reports');
  });
}); 