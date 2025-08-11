const request = require('supertest');
const app = require('../../test/auth-app');

describe('Auth Routes', () => {
  describe('POST /auth/google', () => {
    it('should return error when Google OAuth is not configured', async () => {
      // Clear any existing Google client ID
      delete process.env.GOOGLE_CLIENT_ID;
      
      const response = await request(app)
        .post('/api/auth/google')
        .send({
          idToken: 'invalid-token'
        })
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Google OAuth not configured');
    });

    it('should return error for invalid token', async () => {
      // Set a mock Google client ID
      process.env.GOOGLE_CLIENT_ID = 'mock-client-id';

      const response = await request(app)
        .post('/api/auth/google')
        .send({
          idToken: 'invalid-token'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid Google token');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/google')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Validation error');
    });
  });

  describe('POST /auth/login', () => {
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Validation error');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Validation error');
    });
  });
}); 