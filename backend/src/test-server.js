const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const customerRoutes = require('./routes/customers');
const timeEntryRoutes = require('./routes/timeEntries');
const reportRoutes = require('./routes/reports');
const workingScheduleRoutes = require('./routes/workingSchedules');
const db = require('./config/database');

// Test server configuration
const app = express();
const TEST_PORT = process.env.TEST_PORT || 3002;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use(limiter);

// CORS for test environment
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Test mode authentication bypass
app.use((req, res, next) => {
  // Mock user for all requests in test environment
  req.user = {
    id: '1',
    email: 'admin@tim.com',
    name: 'Admin User',
    roles: ['admin'],
    is_active: true
  };
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'test'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/working-schedules', workingScheduleRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Test server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    environment: 'test'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    environment: 'test'
  });
});

// Start test server
const startTestServer = async () => {
  try {
    // Test database connection
    await db.raw('SELECT 1');
    console.log('✅ Test database connected successfully');

    app.listen(TEST_PORT, '127.0.0.1', () => {
      console.log(`🧪 Test server running on port ${TEST_PORT}`);
      console.log(`📊 Health check: http://localhost:${TEST_PORT}/health`);
      console.log(`🔗 API base: http://localhost:${TEST_PORT}/api`);
      console.log(`⚡ Environment: TEST MODE`);
    });
  } catch (error) {
    console.error('❌ Test server failed to start:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🧪 Test server shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🧪 Test server shutting down gracefully');
  process.exit(0);
});

if (require.main === module) {
  startTestServer();
}

module.exports = { app, startTestServer }; 