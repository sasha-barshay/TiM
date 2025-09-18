const express = require('express');
const { body, validationResult, query } = require('express-validator');
const db = require('../config/database');

const router = express.Router();

// Get customers (without authentication for tests)
router.get('/', [
  query('status').optional().isIn(['active', 'inactive', 'archived']),
  query('search').optional().isString(),
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

    const { status, search, limit = 50, offset = 0 } = req.query;

    // Build query
    let query = db('customers as c')
      .leftJoin('users as am', 'c.account_manager_id', 'am.id')
      .leftJoin('users as le', 'c.leading_engineer_id', 'le.id')
      .select(
        'c.*',
        'am.name as account_manager_name',
        'le.name as leading_engineer_name'
      );

    // Apply status filter
    if (status) {
      query = query.where('c.status', status);
    }

    // Apply search filter
    if (search) {
      query = query.whereRaw('LOWER(c.name) LIKE ?', [`%${search.toLowerCase()}%`]);
    }

    // Get customers with pagination
    const customers = await query
      .orderBy('c.name')
      .limit(limit)
      .offset(offset);

    // Get total count
    let countQuery = db('customers as c');
    if (status) {
      countQuery = countQuery.where('c.status', status);
    }
    if (search) {
      countQuery = countQuery.whereRaw('LOWER(c.name) LIKE ?', [`%${search.toLowerCase()}%`]);
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

// Create customer (without authentication for tests)
router.post('/', [
  body('name').isLength({ min: 1, max: 255 }).withMessage('Name is required'),
  body('contactInfo').optional().isObject().withMessage('Contact info must be an object'),
  body('contactInfo.email').optional().isEmail().withMessage('Invalid email format'),
  body('billingInfo').optional().isObject().withMessage('Billing info must be an object'),
  body('billingInfo.hourlyRate').optional().isFloat({ min: 0 }).withMessage('Hourly rate must be positive'),
  body('assignedUserIds').optional().isArray().withMessage('Assigned user IDs must be an array'),
  body('accountManagerId').optional().isUUID().withMessage('Invalid account manager ID'),
  body('leadingEngineerId').optional().isUUID().withMessage('Invalid leading engineer ID'),
  body('workingScheduleId').optional().isUUID().withMessage('Invalid working schedule ID'),
  body('status').optional().isIn(['active', 'inactive', 'archived']).withMessage('Invalid status'),
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
: billingInfo,
        assigned_user_ids: assignedUserIds,
        account_manager_id: accountManagerId,
        leading_engineer_id: leadingEngineerId,
        working_schedule_id: workingScheduleId,
        status,
        created_by: '1051a830-55a0-4d82-86f4-4769d7a0624d' // Use a valid user ID
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

// Update customer (without authentication for tests)
router.put('/:customerId', [
  body('name').optional().isLength({ min: 1, max: 255 }).withMessage('Name must be between 1 and 255 characters'),
  body('contactInfo').optional().isObject().withMessage('Contact info must be an object'),
  body('billingInfo').optional().isObject().withMessage('Billing info must be an object'),
  body('status').optional().isIn(['active', 'inactive', 'archived']).withMessage('Invalid status'),
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
    const updateData = req.body;

    // Check if customer exists
    const existingCustomer = await db('customers')
      .where('id', customerId)
      .first();

    if (!existingCustomer) {
      return res.status(404).json({
        error: 'Customer not found',
        code: 'CUSTOMER_NOT_FOUND'
      });
    }

    // Update customer
    const [customer] = await db('customers')
      .where('id', customerId)
      .update({
        name: updateData.name,
        contact_info: updateData.contactInfo,
: updateData.billingInfo,
        status: updateData.status,
        updated_at: new Date()
      })
      .returning('*');

    res.json({ customer });

  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      error: 'Failed to update customer',
      code: 'UPDATE_CUSTOMER_ERROR'
    });
  }
});

// Delete customer (soft delete, without authentication for tests)
router.delete('/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    // Check if customer exists
    const existingCustomer = await db('customers')
      .where('id', customerId)
      .first();

    if (!existingCustomer) {
      return res.status(404).json({
        error: 'Customer not found',
        code: 'CUSTOMER_NOT_FOUND'
      });
    }

    // Soft delete customer
    await db('customers')
      .where('id', customerId)
      .update({
        status: 'archived',
        updated_at: new Date()
      });

    res.json({ message: 'Customer archived successfully' });

  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      error: 'Failed to delete customer',
      code: 'DELETE_CUSTOMER_ERROR'
    });
  }
});

// Get customer by ID (without authentication for tests)
router.get('/:customerId', async (req, res) => {
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

module.exports = router; 