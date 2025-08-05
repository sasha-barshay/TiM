const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

// Import routes
const authRoutes = require('../routes/auth');
const userRoutes = require('../routes/users');
const customerRoutes = require('./customers-test'); // Use test-specific route
const timeEntryRoutes = require('../routes/timeEntries');
const reportRoutes = require('../routes/reports');
const workingScheduleRoutes = require('../routes/workingSchedules');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Compression for mobile optimization
app.use(compression());

// CORS configuration for mobile apps
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting for security
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mock authentication middleware for tests
app.use((req, res, next) => {
  // Mock user for all requests in test environment
  req.user = {
    id: '1',
    email: 'admin@test.com',
    name: 'Admin User',
    roles: ['admin'],
    is_active: true
  };
  next();
});

// Mock all auth middleware functions
jest.mock('../middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    req.user = {
      id: '1',
      email: 'admin@test.com',
      name: 'Admin User',
      roles: ['admin'],
      is_active: true
    };
    next();
  },
  requireAccountManager: (req, res, next) => next(),
  requireCustomerAccess: (req, res, next) => next(),
  requireAdmin: (req, res, next) => next(),
  requireRole: () => (req, res, next) => next(),
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes (without authentication middleware)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/working-schedules', workingScheduleRoutes);

// Mobile-specific endpoints
app.get('/api/sync/status', (req, res) => {
  res.json({ 
    status: 'synced',
    lastSync: new Date().toISOString(),
    pendingChanges: 0
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'ENDPOINT_NOT_FOUND',
    path: req.originalUrl
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Handle validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      code: 'VALIDATION_ERROR',
      details: error.message
    });
  }

  // Handle database errors
  if (error.code === '23505') { // Unique constraint violation
    return res.status(409).json({
      error: 'Resource already exists',
      code: 'DUPLICATE_RESOURCE'
    });
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      code: 'TOKEN_INVALID'
    });
  }

  // Default error response
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

module.exports = app; 