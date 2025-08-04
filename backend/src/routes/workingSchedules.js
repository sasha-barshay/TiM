const express = require('express');
const { body, validationResult, query } = require('express-validator');
const db = require('../config/database');
const { requireAccountManager } = require('../middleware/auth');

const router = express.Router();

// Get working schedules (filtered by user permissions)
router.get('/', [
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
    const { limit = 50, offset = 0 } = req.query;

    // Build query - admins can see all, others see only their created schedules
    let query = db('working_schedules as ws')
      .leftJoin('users as u', 'ws.created_by', 'u.id')
      .select(
        'ws.*',
        'u.name as created_by_name'
      );

    // Filter by user permissions
    if (!userRoles.includes('admin')) {
      query = query.where('ws.created_by', userId);
    }

    // Get schedules with pagination
    const schedules = await query
      .orderBy('ws.name')
      .limit(limit)
      .offset(offset);

    // Get total count
    let countQuery = db('working_schedules as ws');
    if (!userRoles.includes('admin')) {
      countQuery = countQuery.where('ws.created_by', userId);
    }
    const [{ count }] = await countQuery.count('* as count');

    res.json({
      schedules,
      pagination: {
        total: parseInt(count),
        limit,
        offset,
        hasMore: offset + limit < count
      }
    });

  } catch (error) {
    console.error('Get working schedules error:', error);
    res.status(500).json({
      error: 'Failed to get working schedules',
      code: 'GET_SCHEDULES_ERROR'
    });
  }
});

// Get working schedule by ID
router.get('/:scheduleId', async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const userId = req.user.id;
    const userRoles = req.user.roles || [];

    const schedule = await db('working_schedules as ws')
      .leftJoin('users as u', 'ws.created_by', 'u.id')
      .where('ws.id', scheduleId)
      .select(
        'ws.*',
        'u.name as created_by_name'
      )
      .first();

    if (!schedule) {
      return res.status(404).json({
        error: 'Working schedule not found',
        code: 'SCHEDULE_NOT_FOUND'
      });
    }

    // Check permissions
    if (!userRoles.includes('admin') && schedule.created_by !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    res.json({ schedule });

  } catch (error) {
    console.error('Get working schedule error:', error);
    res.status(500).json({
      error: 'Failed to get working schedule',
      code: 'GET_SCHEDULE_ERROR'
    });
  }
});

// Create working schedule
router.post('/', [
  body('name').isLength({ min: 1, max: 255 }).withMessage('Name is required'),
  body('timezone').isLength({ min: 1, max: 50 }).withMessage('Timezone is required'),
  body('scheduleConfig').isObject().withMessage('Schedule config must be an object'),
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
      timezone,
      scheduleConfig
    } = req.body;

    // Validate schedule config structure
    if (!scheduleConfig.workingDays || !Array.isArray(scheduleConfig.workingDays)) {
      return res.status(400).json({
        error: 'Invalid schedule config: workingDays array is required',
        code: 'INVALID_SCHEDULE_CONFIG'
      });
    }

    // Create working schedule
    const [schedule] = await db('working_schedules')
      .insert({
        name,
        timezone,
        schedule_config: scheduleConfig,
        created_by: userId
      })
      .returning('*');

    res.status(201).json({ schedule });

  } catch (error) {
    console.error('Create working schedule error:', error);
    res.status(500).json({
      error: 'Failed to create working schedule',
      code: 'CREATE_SCHEDULE_ERROR'
    });
  }
});

// Update working schedule
router.put('/:scheduleId', [
  body('name').optional().isLength({ min: 1, max: 255 }).withMessage('Name is required'),
  body('timezone').optional().isLength({ min: 1, max: 50 }).withMessage('Timezone is required'),
  body('scheduleConfig').optional().isObject().withMessage('Schedule config must be an object'),
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

    const { scheduleId } = req.params;
    const userId = req.user.id;
    const userRoles = req.user.roles || [];
    const {
      name,
      timezone,
      scheduleConfig
    } = req.body;

    // Get existing schedule
    const existingSchedule = await db('working_schedules')
      .where({ id: scheduleId })
      .first();

    if (!existingSchedule) {
      return res.status(404).json({
        error: 'Working schedule not found',
        code: 'SCHEDULE_NOT_FOUND'
      });
    }

    // Check permissions
    if (!userRoles.includes('admin') && existingSchedule.created_by !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    // Validate schedule config if provided
    if (scheduleConfig && (!scheduleConfig.workingDays || !Array.isArray(scheduleConfig.workingDays))) {
      return res.status(400).json({
        error: 'Invalid schedule config: workingDays array is required',
        code: 'INVALID_SCHEDULE_CONFIG'
      });
    }

    // Update working schedule
    const [updatedSchedule] = await db('working_schedules')
      .where({ id: scheduleId })
      .update({
        name: name || existingSchedule.name,
        timezone: timezone || existingSchedule.timezone,
        schedule_config: scheduleConfig || existingSchedule.schedule_config,
        updated_at: new Date()
      })
      .returning('*');

    res.json({ schedule: updatedSchedule });

  } catch (error) {
    console.error('Update working schedule error:', error);
    res.status(500).json({
      error: 'Failed to update working schedule',
      code: 'UPDATE_SCHEDULE_ERROR'
    });
  }
});

// Delete working schedule
router.delete('/:scheduleId', requireAccountManager, async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const userId = req.user.id;
    const userRoles = req.user.roles || [];

    // Get existing schedule
    const existingSchedule = await db('working_schedules')
      .where({ id: scheduleId })
      .first();

    if (!existingSchedule) {
      return res.status(404).json({
        error: 'Working schedule not found',
        code: 'SCHEDULE_NOT_FOUND'
      });
    }

    // Check permissions
    if (!userRoles.includes('admin') && existingSchedule.created_by !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    // Check if schedule is being used by any customers
    const customersUsingSchedule = await db('customers')
      .where({ working_schedule_id: scheduleId })
      .count('* as count');

    if (parseInt(customersUsingSchedule[0].count) > 0) {
      return res.status(400).json({
        error: 'Cannot delete schedule: it is being used by customers',
        code: 'SCHEDULE_IN_USE',
        details: {
          customerCount: parseInt(customersUsingSchedule[0].count)
        }
      });
    }

    // Delete working schedule
    await db('working_schedules')
      .where({ id: scheduleId })
      .del();

    res.json({ message: 'Working schedule deleted successfully' });

  } catch (error) {
    console.error('Delete working schedule error:', error);
    res.status(500).json({
      error: 'Failed to delete working schedule',
      code: 'DELETE_SCHEDULE_ERROR'
    });
  }
});

// Get available timezones
router.get('/timezones/list', async (req, res) => {
  try {
    // Return a list of common timezones
    const timezones = [
      'UTC',
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Asia/Tokyo',
      'Asia/Shanghai',
      'Australia/Sydney',
      'Pacific/Auckland'
    ];

    res.json({ timezones });

  } catch (error) {
    console.error('Get timezones error:', error);
    res.status(500).json({
      error: 'Failed to get timezones',
      code: 'GET_TIMEZONES_ERROR'
    });
  }
});

module.exports = router; 