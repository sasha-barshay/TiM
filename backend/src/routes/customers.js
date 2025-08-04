const express = require('express');
const { body, validationResult, query } = require('express-validator');
const db = require('../config/database');
const { requireAccountManager, requireCustomerAccess } = require('../middleware/auth');

const router = express.Router();

// Get customers (filtered by user permissions)
router.get('/', [
  query('status').optional().isIn(['active', 'inactive', 'archived']),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
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
    const { status, limit = 50, offset = 0 } = req.query;

    // Build query
    let query = db('customers as c')
      .leftJoin('users as am', 'c.account_manager_id', 'am.id')
      .leftJoin('users as le', 'c.leading_engineer_id', 'le.id')
      .select(
        'c.*',
        'am.name as account_manager_name',
        'le.name as leading_engineer_name'
      );

    // Filter by user permissions
    if (!userRoles.includes('admin')) {
      query = query.whereRaw('? = ANY(c.assigned_user_ids)', [userId]);
    }

    // Apply status filter
    if (status) {
      query = query.where('c.status', status);
    }

    // Get customers with pagination
    const customers = await query
      .orderBy('c.name')
      .limit(limit)
      .offset(offset);

    // Get total count
    let countQuery = db('customers as c');
    if (!userRoles.includes('admin')) {
      countQuery = countQuery.whereRaw('? = ANY(c.assigned_user_ids)', [userId]);
    }
    if (status) {
      countQuery = countQuery.where('c.status', status);
    }
    const [{ count }] = await countQuery.count('* as count');

    res.json({
      customers,
      pagination: {
        total: parseInt(count),
        limit,
        offset,
        hasMore: offset + limit < count
      }
    });

  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      error: 'Failed to get customers',
      code: 'GET_CUSTOMERS_ERROR'
    });
  }
});

// Get customer by ID
router.get('/:customerId', requireCustomerAccess, async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await db('customers as c')
      .leftJoin('users as am', 'c.account_manager_id', 'am.id')
      .leftJoin('users as le', 'c.leading_engineer_id', 'le.id')
      .leftJoin('working_schedules as ws', 'c.working_schedule_id', 'ws.id')
      .where('c.id', customerId)
      .select(
        'c.*',
        'am.name as account_manager_name',
        'le.name as leading_engineer_name',
        'ws.name as working_schedule_name',
        'ws.schedule_config as working_schedule_config'
      )
      .first();

    if (!customer) {
      return res.status(404).json({
        error: 'Customer not found',
        code: 'CUSTOMER_NOT_FOUND'
      });
    }

    res.json({ customer });

  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      error: 'Failed to get customer',
      code: 'GET_CUSTOMER_ERROR'
    });
  }
});

// Create customer
router.post('/', [
  body('name').isLength({ min: 1, max: 255 }).withMessage('Name is required'),
  body('contactInfo').optional().isObject().withMessage('Contact info must be an object'),
  body('billingInfo').optional().isObject().withMessage('Billing info must be an object'),
  body('assignedUserIds').optional().isArray().withMessage('Assigned user IDs must be an array'),
  body('accountManagerId').optional().isUUID().withMessage('Invalid account manager ID'),
  body('leadingEngineerId').optional().isUUID().withMessage('Invalid leading engineer ID'),
  body('workingScheduleId').optional().isUUID().withMessage('Invalid working schedule ID'),
  body('status').optional().isIn(['active', 'inactive', 'archived']).withMessage('Invalid status'),
], requireAccountManager, async (req, res) => {
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
    const {
      name,
      contactInfo,
      billingInfo,
      assignedUserIds = [],
      accountManagerId,
      leadingEngineerId,
      workingScheduleId,
      status = 'active'
    } = req.body;

    // Validate assigned users exist
    if (assignedUserIds.length > 0) {
      const existingUsers = await db('users')
        .whereIn('id', assignedUserIds)
        .select('id');
      
      const existingUserIds = existingUsers.map(u => u.id);
      const invalidIds = assignedUserIds.filter(id => !existingUserIds.includes(id));
      
      if (invalidIds.length > 0) {
        return res.status(400).json({
          error: 'Invalid assigned user IDs',
          code: 'INVALID_USER_IDS',
          details: invalidIds
        });
      }
    }

    // Create customer
    const [customer] = await db('customers')
      .insert({
        name,
        contact_info: contactInfo,
        billing_info: billingInfo,
        assigned_user_ids: assignedUserIds,
        account_manager_id: accountManagerId,
        leading_engineer_id: leadingEngineerId,
        working_schedule_id: workingScheduleId,
        status,
        created_by: userId
      })
      .returning('*');

    res.status(201).json({ customer });

  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      error: 'Failed to create customer',
      code: 'CREATE_CUSTOMER_ERROR'
    });
  }
});

// Update customer
router.put('/:customerId', [
  body('name').optional().isLength({ min: 1, max: 255 }).withMessage('Name is required'),
  body('contactInfo').optional().isObject().withMessage('Contact info must be an object'),
  body('billingInfo').optional().isObject().withMessage('Billing info must be an object'),
  body('assignedUserIds').optional().isArray().withMessage('Assigned user IDs must be an array'),
  body('accountManagerId').optional().isUUID().withMessage('Invalid account manager ID'),
  body('leadingEngineerId').optional().isUUID().withMessage('Invalid leading engineer ID'),
  body('workingScheduleId').optional().isUUID().withMessage('Invalid working schedule ID'),
  body('status').optional().isIn(['active', 'inactive', 'archived']).withMessage('Invalid status'),
], requireCustomerAccess, requireAccountManager, async (req, res) => {
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
    const {
      name,
      contactInfo,
      billingInfo,
      assignedUserIds,
      accountManagerId,
      leadingEngineerId,
      workingScheduleId,
      status
    } = req.body;

    // Get existing customer
    const existingCustomer = await db('customers')
      .where({ id: customerId })
      .first();

    if (!existingCustomer) {
      return res.status(404).json({
        error: 'Customer not found',
        code: 'CUSTOMER_NOT_FOUND'
      });
    }

    // Validate assigned users if provided
    if (assignedUserIds && assignedUserIds.length > 0) {
      const existingUsers = await db('users')
        .whereIn('id', assignedUserIds)
        .select('id');
      
      const existingUserIds = existingUsers.map(u => u.id);
      const invalidIds = assignedUserIds.filter(id => !existingUserIds.includes(id));
      
      if (invalidIds.length > 0) {
        return res.status(400).json({
          error: 'Invalid assigned user IDs',
          code: 'INVALID_USER_IDS',
          details: invalidIds
        });
      }
    }

    // Update customer
    const [updatedCustomer] = await db('customers')
      .where({ id: customerId })
      .update({
        name: name || existingCustomer.name,
        contact_info: contactInfo !== undefined ? contactInfo : existingCustomer.contact_info,
        billing_info: billingInfo !== undefined ? billingInfo : existingCustomer.billing_info,
        assigned_user_ids: assignedUserIds !== undefined ? assignedUserIds : existingCustomer.assigned_user_ids,
        account_manager_id: accountManagerId !== undefined ? accountManagerId : existingCustomer.account_manager_id,
        leading_engineer_id: leadingEngineerId !== undefined ? leadingEngineerId : existingCustomer.leading_engineer_id,
        working_schedule_id: workingScheduleId !== undefined ? workingScheduleId : existingCustomer.working_schedule_id,
        status: status || existingCustomer.status,
        updated_at: new Date()
      })
      .returning('*');

    res.json({ customer: updatedCustomer });

  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      error: 'Failed to update customer',
      code: 'UPDATE_CUSTOMER_ERROR'
    });
  }
});

// Delete customer (soft delete by archiving)
router.delete('/:customerId', requireCustomerAccess, requireAccountManager, async (req, res) => {
  try {
    const { customerId } = req.params;

    const updated = await db('customers')
      .where({ id: customerId })
      .update({ 
        status: 'archived',
        updated_at: new Date()
      });

    if (!updated) {
      return res.status(404).json({
        error: 'Customer not found',
        code: 'CUSTOMER_NOT_FOUND'
      });
    }

    res.json({ message: 'Customer archived successfully' });

  } catch (error) {
    console.error('Archive customer error:', error);
    res.status(500).json({
      error: 'Failed to archive customer',
      code: 'ARCHIVE_CUSTOMER_ERROR'
    });
  }
});

// Get customer statistics
router.get('/:customerId/stats', requireCustomerAccess, async (req, res) => {
  try {
    const { customerId } = req.params;
    const { startDate, endDate } = req.query;

    // Build date filter
    let dateFilter = {};
    if (startDate) dateFilter.startDate = startDate;
    if (endDate) dateFilter.endDate = endDate;

    // Get time entries for this customer
    let query = db('time_entries')
      .where({ customer_id: customerId });

    if (startDate) {
      query = query.where('date', '>=', startDate);
    }
    if (endDate) {
      query = query.where('date', '<=', endDate);
    }

    const timeEntries = await query;

    // Calculate statistics
    const totalHours = timeEntries.reduce((sum, entry) => sum + parseFloat(entry.hours), 0);
    const totalEntries = timeEntries.length;
    const averageHoursPerEntry = totalEntries > 0 ? totalHours / totalEntries : 0;

    // Group by status
    const statusCounts = timeEntries.reduce((acc, entry) => {
      acc[entry.status] = (acc[entry.status] || 0) + 1;
      return acc;
    }, {});

    // Group by user
    const userStats = await db('time_entries as te')
      .join('users as u', 'te.user_id', 'u.id')
      .where('te.customer_id', customerId)
      .select('u.name', 'u.id')
      .sum('te.hours as total_hours')
      .count('te.id as entry_count')
      .groupBy('u.id', 'u.name');

    res.json({
      stats: {
        totalHours,
        totalEntries,
        averageHoursPerEntry,
        statusCounts,
        userStats,
        dateRange: dateFilter
      }
    });

  } catch (error) {
    console.error('Get customer stats error:', error);
    res.status(500).json({
      error: 'Failed to get customer statistics',
      code: 'GET_CUSTOMER_STATS_ERROR'
    });
  }
});

module.exports = router; 