const express = require('express');
const { body, validationResult, query } = require('express-validator');
const db = require('../config/database');
const { requireEngineer, requireTimeEntryAccess } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const timeEntryValidation = [
  body('customerId').isUUID().withMessage('Valid customer ID required'),
  body('date').isISO8601().toDate().withMessage('Valid date required'),
  body('hours').optional().isFloat({ min: 0.5 }).withMessage('Minimum 0.5 hours required'),
  body('startTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Start time must be in HH:MM format'),
  body('endTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('End time must be in HH:MM format'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description too long'),
  body('status').optional().isIn(['draft', 'submitted', 'approved', 'rejected']).withMessage('Invalid status'),
  body('locationData').optional().isObject().withMessage('Location data must be an object'),
  body('attachments').optional().isArray().withMessage('Attachments must be an array'),
];

// Helper function to calculate hours from start/end times
const calculateHours = (date, startTime, endTime) => {
  if (!startTime || !endTime) return null;

  const startDateTime = new Date(`${date}T${startTime}`);
  const endDateTime = new Date(`${date}T${endTime}`);

  if (endDateTime <= startDateTime) {
    throw new Error('End time must be after start time');
  }

  const diffMs = endDateTime - startDateTime;
  const hours = diffMs / (1000 * 60 * 60);

  return hours;
};

// Helper function to round hours to nearest 0.5
const roundHours = (hours) => {
  return Math.round(hours * 2) / 2;
};

// Get time entries (with filtering for mobile)
router.get('/', [
  query('startDate').optional().isISO8601().toDate(),
  query('endDate').optional().isISO8601().toDate(),
  query('customerId').optional().isUUID(),
  query('status').optional().isIn(['draft', 'submitted', 'approved', 'rejected']),
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
    const { startDate, endDate, customerId, status, limit = 50, offset = 0 } = req.query;

    // Build query
    let query = db('time_entries as te')
      .join('customers as c', 'te.customer_id', 'c.id')
      .select(
        'te.*',
        'c.name as customer_name'
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
    if (status) {
      query = query.where('te.status', status);
    }

    // Order by date (newest first) and apply pagination
    const timeEntries = await query
      .orderBy('te.date', 'desc')
      .orderBy('te.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [{ count }] = await db('time_entries as te')
      .join('customers as c', 'te.customer_id', 'c.id')
      .count('* as count')
      .where(function() {
        if (!userRoles.includes('admin')) {
          this.where('te.user_id', userId)
            .orWhereRaw('? = ANY(c.assigned_user_ids)', [userId]);
        }
      });

    res.json({
      timeEntries,
      pagination: {
        total: parseInt(count),
        limit,
        offset,
        hasMore: offset + limit < count
      }
    });

  } catch (error) {
    console.error('Get time entries error:', error);
    res.status(500).json({
      error: 'Failed to get time entries',
      code: 'GET_TIME_ENTRIES_ERROR'
    });
  }
});

// Create time entry
router.post('/', timeEntryValidation, requireEngineer, async (req, res) => {
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
      customerId,
      date,
      hours,
      startTime,
      endTime,
      description = '',
      status = 'draft',
      locationData,
      attachments
    } = req.body;

    // Check if user has access to this customer
    const customer = await db('customers')
      .where({ id: customerId })
      .first();

    if (!customer) {
      return res.status(404).json({
        error: 'Customer not found',
        code: 'CUSTOMER_NOT_FOUND'
      });
    }

    const userRoles = req.user.roles || [];
    if (!userRoles.includes('admin')) {
      const assignedUsers = customer.assigned_user_ids || [];
      if (!assignedUsers.includes(userId)) {
        return res.status(403).json({
          error: 'Access denied to this customer',
          code: 'CUSTOMER_ACCESS_DENIED'
        });
      }
    }

    // Calculate hours
    let computedHours = hours;
    if (!computedHours) {
      if (!startTime || !endTime) {
        return res.status(400).json({
          error: 'Either hours or start/end times must be provided',
          code: 'HOURS_REQUIRED'
        });
      }

      try {
        computedHours = calculateHours(date, startTime, endTime);
      } catch (error) {
        return res.status(400).json({
          error: error.message,
          code: 'TIME_CALCULATION_ERROR'
        });
      }
    }

    // Validate minimum hours
    if (computedHours < 0.5) {
      return res.status(400).json({
        error: 'Minimum time entry is 0.5 hours',
        code: 'MINIMUM_HOURS_ERROR'
      });
    }

    // Round hours to nearest 0.5
    const roundedHours = roundHours(computedHours);

    // Create time entry
    const [timeEntry] = await db('time_entries')
      .insert({
        user_id: userId,
        customer_id: customerId,
        date,
        start_time: startTime,
        end_time: endTime,
        hours: roundedHours,
        description,
        status,
        location_data: locationData,
        attachments,
        synced_at: new Date()
      })
      .returning('*');

    // Get customer info for response
    const customerInfo = await db('customers')
      .where({ id: customerId })
      .select('name')
      .first();

    res.status(201).json({
      timeEntry: {
        ...timeEntry,
        customer_name: customerInfo.name
      }
    });

  } catch (error) {
    console.error('Create time entry error:', error);
    res.status(500).json({
      error: 'Failed to create time entry',
      code: 'CREATE_TIME_ENTRY_ERROR'
    });
  }
});

// Quick time entry (mobile-optimized)
router.post('/quick', [
  body('customerId').isUUID().withMessage('Valid customer ID required'),
  body('hours').isFloat({ min: 0.5 }).withMessage('Minimum 0.5 hours required'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description too long'),
], requireEngineer, async (req, res) => {
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
    const { customerId, hours, description = '' } = req.body;
    const date = new Date().toISOString().split('T')[0]; // Today's date

    // Check customer access
    const customer = await db('customers')
      .where({ id: customerId })
      .first();

    if (!customer) {
      return res.status(404).json({
        error: 'Customer not found',
        code: 'CUSTOMER_NOT_FOUND'
      });
    }

    const userRoles = req.user.roles || [];
    if (!userRoles.includes('admin')) {
      const assignedUsers = customer.assigned_user_ids || [];
      if (!assignedUsers.includes(userId)) {
        return res.status(403).json({
          error: 'Access denied to this customer',
          code: 'CUSTOMER_ACCESS_DENIED'
        });
      }
    }

    // Round hours
    const roundedHours = roundHours(hours);

    // Create quick time entry
    const [timeEntry] = await db('time_entries')
      .insert({
        user_id: userId,
        customer_id: customerId,
        date,
        hours: roundedHours,
        description,
        status: 'draft',
        synced_at: new Date()
      })
      .returning('*');

    res.status(201).json({
      timeEntry: {
        ...timeEntry,
        customer_name: customer.name
      }
    });

  } catch (error) {
    console.error('Quick time entry error:', error);
    res.status(500).json({
      error: 'Failed to create quick time entry',
      code: 'QUICK_TIME_ENTRY_ERROR'
    });
  }
});

// Update time entry
router.put('/:timeEntryId', timeEntryValidation, requireTimeEntryAccess, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: errors.array()
      });
    }

    const { timeEntryId } = req.params;
    const {
      customerId,
      date,
      hours,
      startTime,
      endTime,
      description,
      status,
      locationData,
      attachments
    } = req.body;

    // Get existing time entry
    const existingEntry = await db('time_entries')
      .where({ id: timeEntryId })
      .first();

    if (!existingEntry) {
      return res.status(404).json({
        error: 'Time entry not found',
        code: 'TIME_ENTRY_NOT_FOUND'
      });
    }

    // Calculate hours if provided
    let computedHours = hours;
    if (!computedHours && (startTime || endTime)) {
      if (!startTime || !endTime) {
        return res.status(400).json({
          error: 'Both start and end times must be provided',
          code: 'TIME_PAIR_REQUIRED'
        });
      }

      try {
        computedHours = calculateHours(date, startTime, endTime);
      } catch (error) {
        return res.status(400).json({
          error: error.message,
          code: 'TIME_CALCULATION_ERROR'
        });
      }
    }

    // Validate minimum hours
    if (computedHours && computedHours < 0.5) {
      return res.status(400).json({
        error: 'Minimum time entry is 0.5 hours',
        code: 'MINIMUM_HOURS_ERROR'
      });
    }

    // Round hours if provided
    const roundedHours = computedHours ? roundHours(computedHours) : existingEntry.hours;

    // Update time entry
    const [updatedEntry] = await db('time_entries')
      .where({ id: timeEntryId })
      .update({
        customer_id: customerId || existingEntry.customer_id,
        date: date || existingEntry.date,
        start_time: startTime !== undefined ? startTime : existingEntry.start_time,
        end_time: endTime !== undefined ? endTime : existingEntry.end_time,
        hours: roundedHours,
        description: description !== undefined ? description : existingEntry.description,
        status: status || existingEntry.status,
        location_data: locationData || existingEntry.location_data,
        attachments: attachments || existingEntry.attachments,
        updated_at: new Date(),
        synced_at: new Date()
      })
      .returning('*');

    res.json({ timeEntry: updatedEntry });

  } catch (error) {
    console.error('Update time entry error:', error);
    res.status(500).json({
      error: 'Failed to update time entry',
      code: 'UPDATE_TIME_ENTRY_ERROR'
    });
  }
});

// Delete time entry
router.delete('/:timeEntryId', requireTimeEntryAccess, async (req, res) => {
  try {
    const { timeEntryId } = req.params;

    const deleted = await db('time_entries')
      .where({ id: timeEntryId })
      .del();

    if (!deleted) {
      return res.status(404).json({
        error: 'Time entry not found',
        code: 'TIME_ENTRY_NOT_FOUND'
      });
    }

    res.json({ message: 'Time entry deleted successfully' });

  } catch (error) {
    console.error('Delete time entry error:', error);
    res.status(500).json({
      error: 'Failed to delete time entry',
      code: 'DELETE_TIME_ENTRY_ERROR'
    });
  }
});

// Sync offline entries (mobile-specific)
router.post('/sync', [
  body('entries').isArray().withMessage('Entries must be an array'),
  body('entries.*.id').optional().isUUID().withMessage('Invalid entry ID'),
  body('entries.*.customerId').isUUID().withMessage('Valid customer ID required'),
  body('entries.*.date').isISO8601().toDate().withMessage('Valid date required'),
  body('entries.*.hours').isFloat({ min: 0.5 }).withMessage('Minimum 0.5 hours required'),
], requireEngineer, async (req, res) => {
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
    const { entries } = req.body;
    const results = [];

    for (const entry of entries) {
      try {
        // Check if entry already exists
        if (entry.id) {
          const existing = await db('time_entries')
            .where({ id: entry.id, user_id: userId })
            .first();

          if (existing) {
            // Update existing entry
            const [updated] = await db('time_entries')
              .where({ id: entry.id })
              .update({
                hours: roundHours(entry.hours),
                description: entry.description || '',
                synced_at: new Date()
              })
              .returning('*');

            results.push({ id: entry.id, status: 'updated', entry: updated });
            continue;
          }
        }

        // Create new entry
        const [newEntry] = await db('time_entries')
          .insert({
            user_id: userId,
            customer_id: entry.customerId,
            date: entry.date,
            hours: roundHours(entry.hours),
            description: entry.description || '',
            status: 'draft',
            synced_at: new Date()
          })
          .returning('*');

        results.push({ id: newEntry.id, status: 'created', entry: newEntry });

      } catch (error) {
        results.push({
          id: entry.id || 'unknown',
          status: 'error',
          error: error.message
        });
      }
    }

    res.json({
      synced: results.filter(r => r.status !== 'error').length,
      errors: results.filter(r => r.status === 'error').length,
      results
    });

  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({
      error: 'Failed to sync entries',
      code: 'SYNC_ERROR'
    });
  }
});

module.exports = router;