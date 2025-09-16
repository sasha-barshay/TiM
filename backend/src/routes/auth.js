const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const https = require('https');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { verifyGoogleToken, extractGoogleUserInfo } = require('../config/google');

const router = express.Router();

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';



// Generate JWT token
const generateToken = (userId, roles) => {
  return jwt.sign(
    {
      userId,
      roles,
      type: 'access'
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    {
      userId,
      type: 'refresh'
    },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );
};

// Login endpoint
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await db('users')
      .where({ email, is_active: true })
      .first();

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Verify password using password_hash field
    const isValidPassword = await bcrypt.compare(password, user.password_hash || '');

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Update last login
    await db('users')
      .where({ id: user.id })
      .update({ last_login_at: new Date() });

    // Generate tokens
    const accessToken = generateToken(user.id, user.roles);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token (in production, use Redis or database)
    // For now, we'll just return it

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
        timezone: user.timezone,
        avatarUrl: user.avatar_url
      },
      expiresIn: JWT_EXPIRES_IN
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      code: 'LOGIN_ERROR'
    });
  }
});

// Token refresh endpoint
router.post('/refresh', [
  body('refreshToken').notEmpty(),
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

    const { refreshToken } = req.body;

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET);

    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Get user
    const user = await db('users')
      .where({ id: decoded.userId, is_active: true })
      .first();

    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Generate new tokens
    const newAccessToken = generateToken(user.id, user.roles);
    const newRefreshToken = generateRefreshToken(user.id);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: JWT_EXPIRES_IN
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Token refresh failed',
      code: 'REFRESH_ERROR'
    });
  }
});

// Google OAuth token exchange endpoint
router.post('/google/exchange', [
  body('code').notEmpty(),
  body('redirect_uri').notEmpty(),
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

    const { code, redirect_uri } = req.body;

    // Exchange authorization code for tokens using https module
    const postData = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirect_uri,
    }).toString();

    const tokenData = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'oauth2.googleapis.com',
        port: 443,
        path: '/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(data);
            if (res.statusCode >= 400) {
              console.error('Google token exchange failed:', parsedData);
              reject(new Error(parsedData.error || 'Token exchange failed'));
            } else {
              resolve(parsedData);
            }
          } catch (error) {
            reject(new Error('Failed to parse token response'));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(postData);
      req.end();
    });

    if (!tokenData.id_token) {
      return res.status(400).json({
        error: 'No ID token received from Google',
        code: 'NO_ID_TOKEN'
      });
    }

    res.json({
      id_token: tokenData.id_token,
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in
    });

  } catch (error) {
    console.error('Google token exchange error:', error);
    res.status(500).json({
      error: 'Token exchange failed',
      code: 'TOKEN_EXCHANGE_ERROR'
    });
  }
});

// Google SSO login endpoint
router.post('/google', [
  body('idToken').notEmpty(),
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

    const { idToken } = req.body;

    // Verify the Google ID token
    let payload;
    try {
      payload = await verifyGoogleToken(idToken);
    } catch (verifyError) {
      console.error('Google token verification failed:', verifyError);
      return res.status(401).json({
        error: verifyError.message,
        code: 'INVALID_GOOGLE_TOKEN'
      });
    }

    // Extract user information from Google payload
    const googleUser = extractGoogleUserInfo(payload);

    // Verify email is verified
    if (!googleUser.emailVerified) {
      return res.status(400).json({
        error: 'Email not verified with Google',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    // Find or create user
    let user = await db('users')
      .where({ email: googleUser.email })
      .first();

    if (!user) {
      // Create new user with default engineer role
      const [newUser] = await db('users')
        .insert({
          email: googleUser.email,
          name: googleUser.name,
          avatar_url: googleUser.picture,
          roles: ['engineer'], // Default role for new Google users
          timezone: 'UTC',
          is_active: true
        })
        .returning('*');

      user = newUser;
    } else if (!user.is_active) {
      return res.status(403).json({
        error: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Update last login and avatar
    await db('users')
      .where({ id: user.id })
      .update({
        last_login_at: new Date(),
        avatar_url: googleUser.picture,
        name: googleUser.name // Update name in case it changed
      });

    // Generate tokens
    const accessToken = generateToken(user.id, user.roles);
    const refreshToken = generateRefreshToken(user.id);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
        timezone: user.timezone,
        avatarUrl: user.avatar_url
      },
      expiresIn: JWT_EXPIRES_IN
    });

  } catch (error) {
    console.error('Google SSO error:', error);
    res.status(500).json({
      error: 'Google SSO failed',
      code: 'GOOGLE_SSO_ERROR'
    });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    // In production, invalidate the refresh token
    // For now, just return success
    res.json({
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      code: 'LOGOUT_ERROR'
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        roles: req.user.roles,
        timezone: req.user.timezone,
        avatarUrl: req.user.avatar_url,
        lastLoginAt: req.user.last_login_at
      }
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      error: 'Failed to get profile',
      code: 'PROFILE_ERROR'
    });
  }
});

module.exports = router;