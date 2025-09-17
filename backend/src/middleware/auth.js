const jwt = require('jsonwebtoken');
const db = require('../config/database');

// JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    // Skip authentication in test mode
    if (process.env.NODE_ENV === 'test') {
      // Mock user for testing
      req.user = {
        id: '1',
        email: 'admin@tim.com',
        name: 'Admin User',
        roles: ['admin'],
        is_active: true
      };
      return next();
    }

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        code: 'TOKEN_MISSING'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user from database
    const user = await db('users')
      .where({ id: decoded.userId, is_active: true })
      .first();

    if (!user) {
      return res.status(401).json({
        error: 'Invalid or expired token',
        code: 'TOKEN_INVALID'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        code: 'TOKEN_INVALID'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRoles = req.user.roles || [];
    const hasRole = Array.isArray(roles)
      ? roles.some(role => userRoles.includes(role))
      : userRoles.includes(roles);

    if (!hasRole) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

// Admin only middleware
const requireAdmin = requireRole('admin');

// Account manager or admin middleware
const requireAccountManager = requireRole(['admin', 'account_manager']);

// Engineer or higher middleware
const requireEngineer = requireRole(['admin', 'account_manager', 'engineer']);

// Check if user has access to specific customer
const requireCustomerAccess = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const userId = req.user.id;
    const userRoles = req.user.roles || [];

    // Admins have access to all customers
    if (userRoles.includes('admin')) {
      return next();
    }

    // Check if user is assigned to this customer
    const customer = await db('customers')
      .where({ id: customerId })
      .first();

    if (!customer) {
      return res.status(404).json({
        error: 'Customer not found',
        code: 'CUSTOMER_NOT_FOUND'
      });
    }

    const assignedUsers = customer.assigned_user_ids || [];
    if (!assignedUsers.includes(userId)) {
      return res.status(403).json({
        error: 'Access denied to this customer',
        code: 'CUSTOMER_ACCESS_DENIED'
      });
    }

    next();
  } catch (error) {
    console.error('Customer access check error:', error);
    return res.status(500).json({
      error: 'Access check error',
      code: 'ACCESS_CHECK_ERROR'
    });
  }
};

// Check if user can access specific time entry
const requireTimeEntryAccess = async (req, res, next) => {
  try {
    const { timeEntryId } = req.params;
    const userId = req.user.id;
    const userRoles = req.user.roles || [];

    // Admins can access all time entries
    if (userRoles.includes('admin')) {
      return next();
    }

    // Get time entry with customer info
    const timeEntry = await db('time_entries as te')
      .join('customers as c', 'te.customer_id', 'c.id')
      .where('te.id', timeEntryId)
      .select('te.*', 'c.assigned_user_ids')
      .first();

    if (!timeEntry) {
      return res.status(404).json({
        error: 'Time entry not found',
        code: 'TIME_ENTRY_NOT_FOUND'
      });
    }

    // Users can always access their own time entries
    if (timeEntry.user_id === userId) {
      return next();
    }

    // Account managers can access time entries for their customers
    if (userRoles.includes('account_manager')) {
      const assignedUsers = timeEntry.assigned_user_ids || [];
      if (assignedUsers.includes(userId)) {
        return next();
      }
    }

    return res.status(403).json({
      error: 'Access denied to this time entry',
      code: 'TIME_ENTRY_ACCESS_DENIED'
    });
  } catch (error) {
    console.error('Time entry access check error:', error);
    return res.status(500).json({
      error: 'Access check error',
      code: 'ACCESS_CHECK_ERROR'
    });
  }
};

// Check if user has assigned customers (required for app access)
const requireCustomerAssignment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRoles = req.user.roles || [];

    // Admins and account managers can access the app without customer assignment
    if (userRoles.includes('admin') || userRoles.includes('account_manager')) {
      return next();
    }

    // Check if user is assigned to any customers
    const assignedCustomers = await db('customers')
      .whereRaw('? = ANY(assigned_user_ids)', [userId])
      .where('status', 'active')
      .count('* as count')
      .first();

    const customerCount = parseInt(assignedCustomers.count);

    if (customerCount === 0) {
      return res.status(403).json({
        error: 'No customers assigned. Please contact your administrator.',
        code: 'NO_CUSTOMERS_ASSIGNED'
      });
    }

    next();
  } catch (error) {
    console.error('Customer assignment check error:', error);
    return res.status(500).json({
      error: 'Access check error',
      code: 'ACCESS_CHECK_ERROR'
    });
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireAccountManager,
  requireEngineer,
  requireCustomerAccess,
  requireTimeEntryAccess,
  requireCustomerAssignment,
};