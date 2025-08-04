const express = require('express');
const { body, validationResult, query } = require('express-validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../config/database');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get users (admin only)
router.get('/', [
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
], requireAdmin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: errors.array()
      });
    }

    const { limit = 50, offset = 0 } = req.query;

    const users = await db('users')
      .select('id', 'email', 'name', 'roles', 'timezone', 'avatar_url', 'created_at', 'last_login_at', 'is_active')
      .orderBy('name')
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db('users').count('* as count');

    res.json({
      users,
      pagination: {
        total: parseInt(count),
        limit,
        offset,
        hasMore: offset + limit < count
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Failed to get users',
      code: 'GET_USERS_ERROR'
    });
  }
});

// Get user by ID
router.get('/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await db('users')
      .where({ id: userId })
      .select('id', 'email', 'name', 'roles', 'timezone', 'avatar_url', 'created_at', 'last_login_at', 'is_active')
      .first();

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({ user });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to get user',
      code: 'GET_USER_ERROR'
    });
  }
});

// Create user invitation
router.post('/invite', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('roles').isArray().withMessage('Roles must be an array'),
  body('roles.*').isIn(['admin', 'account_manager', 'engineer']).withMessage('Invalid role'),
], requireAdmin, async (req, res) => {
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
    const { email, roles } = req.body;

    // Check if user already exists
    const existingUser = await db('users')
      .where({ email })
      .first();

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        code: 'USER_ALREADY_EXISTS'
      });
    }

    // Check if invitation already exists
    const existingInvitation = await db('invitations')
      .where({ email })
      .first();

    if (existingInvitation) {
      return res.status(409).json({
        error: 'Invitation already sent',
        code: 'INVITATION_ALREADY_EXISTS'
      });
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invitation
    const [invitation] = await db('invitations')
      .insert({
        email,
        roles,
        invited_by: userId,
        token,
        expires_at: expiresAt
      })
      .returning('*');

    // Generate invitation URL (in production, this would be your frontend URL)
    const invitationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite?token=${token}`;

    res.status(201).json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        roles: invitation.roles,
        expiresAt: invitation.expires_at,
        invitationUrl
      }
    });

  } catch (error) {
    console.error('Create invitation error:', error);
    res.status(500).json({
      error: 'Failed to create invitation',
      code: 'CREATE_INVITATION_ERROR'
    });
  }
});

// Get invitations
router.get('/invitations', requireAdmin, async (req, res) => {
  try {
    const invitations = await db('invitations as i')
      .join('users as u', 'i.invited_by', 'u.id')
      .select(
        'i.*',
        'u.name as invited_by_name'
      )
      .orderBy('i.created_at', 'desc');

    res.json({ invitations });

  } catch (error) {
    console.error('Get invitations error:', error);
    res.status(500).json({
      error: 'Failed to get invitations',
      code: 'GET_INVITATIONS_ERROR'
    });
  }
});

// Accept invitation
router.post('/invite/accept', [
  body('token').notEmpty().withMessage('Token is required'),
  body('name').isLength({ min: 1, max: 255 }).withMessage('Name is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
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

    const { token, name, password } = req.body;

    // Find invitation
    const invitation = await db('invitations')
      .where({ token })
      .first();

    if (!invitation) {
      return res.status(404).json({
        error: 'Invalid invitation token',
        code: 'INVALID_INVITATION_TOKEN'
      });
    }

    // Check if invitation is expired
    if (new Date() > invitation.expires_at) {
      return res.status(400).json({
        error: 'Invitation has expired',
        code: 'INVITATION_EXPIRED'
      });
    }

    // Check if invitation is already accepted
    if (invitation.accepted_at) {
      return res.status(400).json({
        error: 'Invitation already accepted',
        code: 'INVITATION_ALREADY_ACCEPTED'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const [user] = await db('users')
      .insert({
        email: invitation.email,
        name,
        roles: invitation.roles,
        password: hashedPassword,
        timezone: 'UTC'
      })
      .returning('*');

    // Mark invitation as accepted
    await db('invitations')
      .where({ id: invitation.id })
      .update({ accepted_at: new Date() });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles
      }
    });

  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({
      error: 'Failed to accept invitation',
      code: 'ACCEPT_INVITATION_ERROR'
    });
  }
});

// Update user
router.put('/:userId', [
  body('name').optional().isLength({ min: 1, max: 255 }).withMessage('Name is required'),
  body('roles').optional().isArray().withMessage('Roles must be an array'),
  body('roles.*').optional().isIn(['admin', 'account_manager', 'engineer']).withMessage('Invalid role'),
  body('timezone').optional().isLength({ min: 1, max: 50 }).withMessage('Timezone is required'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
], requireAdmin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: errors.array()
      });
    }

    const { userId } = req.params;
    const { name, roles, timezone, isActive } = req.body;

    // Get existing user
    const existingUser = await db('users')
      .where({ id: userId })
      .first();

    if (!existingUser) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Update user
    const [updatedUser] = await db('users')
      .where({ id: userId })
      .update({
        name: name || existingUser.name,
        roles: roles || existingUser.roles,
        timezone: timezone || existingUser.timezone,
        is_active: isActive !== undefined ? isActive : existingUser.is_active,
        updated_at: new Date()
      })
      .returning('*');

    res.json({ user: updatedUser });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      error: 'Failed to update user',
      code: 'UPDATE_USER_ERROR'
    });
  }
});

// Delete user (soft delete)
router.delete('/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // Don't allow deleting yourself
    if (userId === req.user.id) {
      return res.status(400).json({
        error: 'Cannot delete your own account',
        code: 'CANNOT_DELETE_SELF'
      });
    }

    const updated = await db('users')
      .where({ id: userId })
      .update({ 
        is_active: false,
        updated_at: new Date()
      });

    if (!updated) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({ message: 'User deactivated successfully' });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      error: 'Failed to delete user',
      code: 'DELETE_USER_ERROR'
    });
  }
});

module.exports = router; 