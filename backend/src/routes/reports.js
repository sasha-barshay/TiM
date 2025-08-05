const express = require('express');
const { query, validationResult } = require('express-validator');
const db = require('../config/database');

const router = express.Router();

// Get dashboard overview
router.get('/dashboard', [
  query('startDate').optional().isISO8601().toDate(),
  query('endDate').optional().isISO8601().toDate(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: errors.array()
      });
    }

    const userId = req.user.id;
    const userRoles = req.user.roles || [];
    const { startDate, endDate } = req.query;

    // Default to last 30 days if no dates provided
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const defaultStartDate = startDate || thirtyDaysAgo.toISOString().split('T')[0];
    const defaultEndDate = endDate || now.toISOString().split('T')[0];

    // Build base query for time entries
    let baseQuery = db('time_entries as te')
      .join('customers as c', 'te.customer_id', 'c.id')
      .join('users as u', 'te.user_id', 'u.id');

    // Filter by user permissions
    if (!userRoles.includes('admin')) {
      baseQuery = baseQuery.where(function() {
        this.where('te.user_id', userId)
          .orWhereRaw('? = ANY(c.assigned_user_ids)', [userId]);
      });
    }

    // Apply date filter
    baseQuery = baseQuery.whereBetween('te.date', [defaultStartDate, defaultEndDate]);

    // Get total hours and earnings
    const result = await baseQuery.clone()
      .select(
        db.raw('COALESCE(SUM(te.hours), 0) as total_hours'),
        db.raw('COALESCE(SUM(te.hours * COALESCE((c.billing_info->>\'hourly_rate\')::numeric, 0)), 0) as total_earnings')
      );
    const totalHours = result[0]?.total_hours || 0;
    const totalEarnings = result[0]?.total_earnings || 0;

    // Get time entries by status
    const statusStats = await baseQuery.clone()
      .select('te.status')
      .count('* as count')
      .sum('te.hours as hours')
      .groupBy('te.status');

    // Get top customers by hours
    const topCustomers = await baseQuery.clone()
      .select('c.name', 'c.id')
      .sum('te.hours as total_hours')
      .count('te.id as entry_count')
      .groupBy('c.id', 'c.name')
      .orderBy('total_hours', 'desc')
      .limit(5);

    // Get recent time entries
    const recentEntries = await baseQuery
      .select(
        'te.id',
        'te.date',
        'te.hours',
        'te.description',
        'te.status',
        'c.name as customer_name',
        'u.name as user_name'
      )
      .orderBy('te.date', 'desc')
      .orderBy('te.created_at', 'desc')
      .limit(10);

    // Get monthly trend (last 6 months)
    const monthlyTrend = await db('time_entries as te')
      .join('customers as c', 'te.customer_id', 'c.id')
      .where(function() {
        if (!userRoles.includes('admin')) {
          this.where('te.user_id', userId)
            .orWhereRaw('? = ANY(c.assigned_user_ids)', [userId]);
        }
      })
      .where('te.date', '>=', new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0])
      .select(
        db.raw('DATE_TRUNC(\'month\', te.date) as month'),
        db.raw('SUM(te.hours) as total_hours'),
        db.raw('COUNT(te.id) as entry_count')
      )
      .groupBy(db.raw('DATE_TRUNC(\'month\', te.date)'))
      .orderBy('month');

    res.json({
      dashboard: {
        period: {
          startDate: defaultStartDate,
          endDate: defaultEndDate
        },
        summary: {
          totalHours: parseFloat(totalHours || 0),
          totalEarnings: parseFloat(totalEarnings || 0),
          totalEntries: recentEntries.length
        },
        statusStats,
        topCustomers,
        recentEntries,
        monthlyTrend: monthlyTrend.map(item => ({
          month: item.month,
          totalHours: parseFloat(item.total_hours || 0),
          entryCount: parseInt(item.entry_count || 0)
        }))
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      error: 'Failed to get dashboard data',
      code: 'DASHBOARD_ERROR'
    });
  }
});

// Get time entries report
router.get('/time-entries', [
  query('startDate').optional().isISO8601().toDate(),
  query('endDate').optional().isISO8601().toDate(),
  query('customerId').optional().isUUID(),
  query('userId').optional().isUUID(),
  query('status').optional().isIn(['draft', 'submitted', 'approved', 'rejected']),
  query('limit').optional().isInt({ min: 1, max: 1000 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: errors.array()
      });
    }

    const userId = req.user.id;
    const userRoles = req.user.roles || [];
    const { 
      startDate, 
      endDate, 
      customerId, 
      userId: filterUserId, 
      status, 
      limit = 100, 
      offset = 0 
    } = req.query;

    // Build query
    let query = db('time_entries as te')
      .join('customers as c', 'te.customer_id', 'c.id')
      .join('users as u', 'te.user_id', 'u.id')
      .select(
        'te.*',
        'c.name as customer_name',
        'c.billing_info',
        'u.name as user_name'
      );

    // Filter by user permissions
    if (!userRoles.includes('admin')) {
      query = query.where(function() {
        this.where('te.user_id', userId)
          .orWhereRaw('? = ANY(c.assigned_user_ids)', [userId]);
      });
    }

    // Apply filters
    if (startDate) {
      query = query.where('te.date', '>=', startDate);
    }
    if (endDate) {
      query = query.where('te.date', '<=', endDate);
    }
    if (customerId) {
      query = query.where('te.customer_id', customerId);
    }
    if (filterUserId) {
      query = query.where('te.user_id', filterUserId);
    }
    if (status) {
      query = query.where('te.status', status);
    }

    // Get time entries with pagination
    const timeEntries = await query
      .orderBy('te.date', 'desc')
      .orderBy('te.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    // Get total count
    let countQuery = db('time_entries as te')
      .join('customers as c', 'te.customer_id', 'c.id');

    if (!userRoles.includes('admin')) {
      countQuery = countQuery.where(function() {
        this.where('te.user_id', userId)
          .orWhereRaw('? = ANY(c.assigned_user_ids)', [userId]);
      });
    }

    if (startDate) countQuery = countQuery.where('te.date', '>=', startDate);
    if (endDate) countQuery = countQuery.where('te.date', '<=', endDate);
    if (customerId) countQuery = countQuery.where('te.customer_id', customerId);
    if (filterUserId) countQuery = countQuery.where('te.user_id', filterUserId);
    if (status) countQuery = countQuery.where('te.status', status);

    const [{ count }] = await countQuery.count('* as count');

    // Calculate summary
    const totalHours = timeEntries.reduce((sum, entry) => sum + parseFloat(entry.hours), 0);
    const totalEarnings = timeEntries.reduce((sum, entry) => {
      const hourlyRate = entry.billing_info?.hourly_rate || 0;
      return sum + (parseFloat(entry.hours) * parseFloat(hourlyRate));
    }, 0);

    res.json({
      timeEntries,
      summary: {
        totalHours,
        totalEarnings,
        totalEntries: timeEntries.length,
        totalCount: parseInt(count)
      },
      pagination: {
        total: parseInt(count),
        limit,
        offset,
        hasMore: offset + limit < count
      },
      filters: {
        startDate,
        endDate,
        customerId,
        userId: filterUserId,
        status
      }
    });

  } catch (error) {
    console.error('Time entries report error:', error);
    res.status(500).json({
      error: 'Failed to get time entries report',
      code: 'TIME_ENTRIES_REPORT_ERROR'
    });
  }
});

// Export time entries as CSV
router.get('/time-entries/export', [
  query('startDate').optional().isISO8601().toDate(),
  query('endDate').optional().isISO8601().toDate(),
  query('customerId').optional().isUUID(),
  query('userId').optional().isUUID(),
  query('status').optional().isIn(['draft', 'submitted', 'approved', 'rejected']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: errors.array()
      });
    }

    const userId = req.user.id;
    const userRoles = req.user.roles || [];
    const { startDate, endDate, customerId, userId: filterUserId, status } = req.query;

    // Build query (no pagination for export)
    let query = db('time_entries as te')
      .join('customers as c', 'te.customer_id', 'c.id')
      .join('users as u', 'te.user_id', 'u.id')
      .select(
        'te.date',
        'te.hours',
        'te.description',
        'te.status',
        'c.name as customer_name',
        'u.name as user_name',
        db.raw('COALESCE(c.billing_info->>\'hourly_rate\', \'0\') as hourly_rate'),
        db.raw('te.hours * COALESCE(c.billing_info->>\'hourly_rate\', \'0\')::numeric as earnings')
      );

    // Filter by user permissions
    if (!userRoles.includes('admin')) {
      query = query.where(function() {
        this.where('te.user_id', userId)
          .orWhereRaw('? = ANY(c.assigned_user_ids)', [userId]);
      });
    }

    // Apply filters
    if (startDate) query = query.where('te.date', '>=', startDate);
    if (endDate) query = query.where('te.date', '<=', endDate);
    if (customerId) query = query.where('te.customer_id', customerId);
    if (filterUserId) query = query.where('te.user_id', filterUserId);
    if (status) query = query.where('te.status', status);

    const timeEntries = await query.orderBy('te.date', 'desc');

    // Generate CSV content
    const csvHeaders = [
      'Date',
      'User',
      'Customer',
      'Hours',
      'Hourly Rate',
      'Earnings',
      'Description',
      'Status'
    ];

    const csvRows = timeEntries.map(entry => [
      entry.date,
      entry.user_name,
      entry.customer_name,
      entry.hours,
      entry.hourly_rate,
      entry.earnings,
      `"${(entry.description || '').replace(/"/g, '""')}"`,
      entry.status
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.join(','))
      .join('\n');

    // Set response headers for CSV download
    const filename = `time-entries-${new Date().toISOString().split('T')[0]}.csv`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      error: 'Failed to export time entries',
      code: 'EXPORT_ERROR'
    });
  }
});

// Get customer report
router.get('/customers/:customerId', [
  query('startDate').optional().isISO8601().toDate(),
  query('endDate').optional().isISO8601().toDate(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: errors.array()
      });
    }

    const { customerId } = req.params;
    const { startDate, endDate } = req.query;

    // Get customer info
    const customer = await db('customers')
      .where({ id: customerId })
      .first();

    if (!customer) {
      return res.status(404).json({
        error: 'Customer not found',
        code: 'CUSTOMER_NOT_FOUND'
      });
    }

    // Build time entries query
    let query = db('time_entries as te')
      .join('users as u', 'te.user_id', 'u.id')
      .where('te.customer_id', customerId);

    if (startDate) query = query.where('te.date', '>=', startDate);
    if (endDate) query = query.where('te.date', '<=', endDate);

    const timeEntries = await query
      .select(
        'te.*',
        'u.name as user_name'
      )
      .orderBy('te.date', 'desc');

    // Calculate statistics
    const totalHours = timeEntries.reduce((sum, entry) => sum + parseFloat(entry.hours), 0);
    const totalEarnings = timeEntries.reduce((sum, entry) => {
      const hourlyRate = customer.billing_info?.hourly_rate || 0;
      return sum + (parseFloat(entry.hours) * parseFloat(hourlyRate));
    }, 0);

    // Group by user
    const userStats = timeEntries.reduce((acc, entry) => {
      if (!acc[entry.user_id]) {
        acc[entry.user_id] = {
          userId: entry.user_id,
          userName: entry.user_name,
          totalHours: 0,
          totalEntries: 0,
          averageHours: 0
        };
      }
      acc[entry.user_id].totalHours += parseFloat(entry.hours);
      acc[entry.user_id].totalEntries += 1;
      return acc;
    }, {});

    // Calculate averages
    Object.values(userStats).forEach(user => {
      user.averageHours = user.totalEntries > 0 ? user.totalHours / user.totalEntries : 0;
    });

    // Group by status
    const statusStats = timeEntries.reduce((acc, entry) => {
      acc[entry.status] = (acc[entry.status] || 0) + 1;
      return acc;
    }, {});

    // Monthly breakdown
    const monthlyStats = timeEntries.reduce((acc, entry) => {
      const month = entry.date.substring(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = {
          month,
          totalHours: 0,
          totalEntries: 0,
          totalEarnings: 0
        };
      }
      acc[month].totalHours += parseFloat(entry.hours);
      acc[month].totalEntries += 1;
      acc[month].totalEarnings += parseFloat(entry.hours) * parseFloat(customer.billing_info?.hourly_rate || 0);
      return acc;
    }, {});

    res.json({
      customer: {
        id: customer.id,
        name: customer.name,
        billingInfo: customer.billing_info
      },
      period: {
        startDate,
        endDate
      },
      summary: {
        totalHours,
        totalEarnings,
        totalEntries: timeEntries.length,
        averageHoursPerEntry: timeEntries.length > 0 ? totalHours / timeEntries.length : 0
      },
      userStats: Object.values(userStats),
      statusStats,
      monthlyStats: Object.values(monthlyStats).sort((a, b) => b.month.localeCompare(a.month)),
      timeEntries
    });

  } catch (error) {
    console.error('Customer report error:', error);
    res.status(500).json({
      error: 'Failed to get customer report',
      code: 'CUSTOMER_REPORT_ERROR'
    });
  }
});

module.exports = router; 