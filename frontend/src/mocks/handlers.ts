import { rest } from 'msw';

// Mock data
export const mockDashboardData = {
  summary: {
    totalHours: 120.5,
    totalEarnings: 12050,
    totalEntries: 45,
  },
  statusStats: [
    { status: 'approved', count: 30, hours: 80.5 },
    { status: 'submitted', count: 10, hours: 25.0 },
    { status: 'draft', count: 5, hours: 15.0 },
  ],
  topCustomers: [
    { id: '1', name: 'Acme Corp', totalHours: 45.5, entryCount: 15 },
    { id: '2', name: 'TechStart', totalHours: 32.0, entryCount: 12 },
    { id: '3', name: 'Global Inc', totalHours: 28.5, entryCount: 10 },
  ],
  recentEntries: [
    {
      id: '1',
      description: 'Frontend development',
      customerName: 'Acme Corp',
      userName: 'John Doe',
      date: '2024-01-15',
      hours: 8.0,
      status: 'approved',
    },
  ],
  monthlyTrend: [
    { month: '2024-01', totalHours: 120.5, entryCount: 45 },
    { month: '2023-12', totalHours: 110.0, entryCount: 42 },
  ],
};

export const mockCustomers = {
  data: [
    {
      id: '1',
      name: 'Acme Corp',
      contactInfo: { email: 'contact@acme.com', phone: '+1234567890' },
      billingInfo: { hourlyRate: 100, currency: 'USD' },
      status: 'active',
      assignedUserIds: ['1', '2'],
      accountManagerId: '1',
      leadingEngineerId: '2',
    },
  ],
  total: 1,
  page: 1,
  limit: 10,
};

export const mockTimeEntries = {
  timeEntries: [
    {
      id: '1',
      userId: '1',
      customerId: '1',
      date: '2024-01-15',
      hours: 8.0,
      description: 'Frontend development',
      status: 'approved',
      customerName: 'Acme Corp',
      userName: 'John Doe',
    },
  ],
  total: 1,
  page: 1,
  limit: 10,
};

export const mockWorkingSchedules = [
  {
    id: '1',
    name: 'Standard 9-5',
    timezone: 'America/New_York',
    scheduleConfig: {
      workingDays: {
        monday: { startTime: '09:00', endTime: '17:00' },
        tuesday: { startTime: '09:00', endTime: '17:00' },
        wednesday: { startTime: '09:00', endTime: '17:00' },
        thursday: { startTime: '09:00', endTime: '17:00' },
        friday: { startTime: '09:00', endTime: '17:00' },
      },
      breakTime: { startTime: '12:00', endTime: '13:00' },
    },
    createdBy: '1',
    createdByName: 'Admin User',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// API handlers
export const handlers = [
  // Dashboard
  rest.get('/api/reports/dashboard', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockDashboardData));
  }),

  // Customers
  rest.get('/api/customers', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockCustomers));
  }),

  rest.post('/api/customers', (req, res, ctx) => {
    return res(ctx.status(201), ctx.json({ id: '2', ...req.body }));
  }),

  rest.put('/api/customers/:id', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ id: req.params.id, ...req.body }));
  }),

  rest.delete('/api/customers/:id', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ message: 'Customer archived successfully' }));
  }),

  // Time Entries
  rest.get('/api/time-entries', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockTimeEntries));
  }),

  rest.post('/api/time-entries', (req, res, ctx) => {
    return res(ctx.status(201), ctx.json({ id: '2', ...req.body }));
  }),

  rest.put('/api/time-entries/:id', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ id: req.params.id, ...req.body }));
  }),

  rest.delete('/api/time-entries/:id', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ message: 'Time entry deleted successfully' }));
  }),

  // Working Schedules
  rest.get('/api/working-schedules', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockWorkingSchedules));
  }),

  rest.get('/api/working-schedules/timezones/list', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json([
      'America/New_York',
      'America/Los_Angeles',
      'Europe/London',
      'Asia/Tokyo',
    ]));
  }),

  rest.post('/api/working-schedules', (req, res, ctx) => {
    return res(ctx.status(201), ctx.json({ id: '2', ...req.body }));
  }),

  rest.put('/api/working-schedules/:id', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ id: req.params.id, ...req.body }));
  }),

  rest.delete('/api/working-schedules/:id', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ message: 'Working schedule deleted successfully' }));
  }),

  // Auth
  rest.get('/api/auth/profile', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({
      id: '1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
    }));
  }),

  // Reports
  rest.get('/api/reports/time-entries', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockTimeEntries));
  }),

  rest.get('/api/reports/export', (req, res, ctx) => {
    const csvContent = 'Date,Hours,Description,Customer\n2024-01-15,8.0,Frontend development,Acme Corp';
    return res(
      ctx.status(200),
      ctx.set('Content-Type', 'text/csv'),
      ctx.set('Content-Disposition', 'attachment; filename=time-entries.csv'),
      ctx.body(csvContent)
    );
  }),
]; 