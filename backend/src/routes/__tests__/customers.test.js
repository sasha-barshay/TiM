const request = require('supertest');
const app = require('../../index');
const db = require('../../config/database');

// Mock authentication middleware
jest.mock('../../middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { id: '1', role: 'admin' };
    next();
  },
  requireAccountManager: (req, res, next) => next(),
}));

describe('Customers API', () => {
  let testCustomerId;

  beforeAll(async () => {
    // Clean up test data
    await db('customers').where('name', 'Test Customer').del();
  });

  afterAll(async () => {
    // Clean up test data
    await db('customers').where('name', 'Test Customer').del();
    await db.destroy();
  });

  describe('GET /api/customers', () => {
    it('should return list of customers', async () => {
      const response = await request(app)
        .get('/api/customers')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter customers by status', async () => {
      const response = await request(app)
        .get('/api/customers?status=active')
        .expect(200);

      expect(response.body.data.every(customer => customer.status === 'active')).toBe(true);
    });

    it('should search customers by name', async () => {
      const response = await request(app)
        .get('/api/customers?search=test')
        .expect(200);

      expect(response.body.data.every(customer => 
        customer.name.toLowerCase().includes('test')
      )).toBe(true);
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/customers?page=1&limit=5')
        .expect(200);

      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(5);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('POST /api/customers', () => {
    it('should create a new customer', async () => {
      const customerData = {
        name: 'Test Customer',
        contactInfo: {
          email: 'test@example.com',
          phone: '+1234567890',
          address: '123 Test St'
        },
        billingInfo: {
          hourlyRate: 100,
          currency: 'USD',
          paymentTerms: 'Net 30'
        },
        assignedUserIds: ['1', '2'],
        accountManagerId: '1',
        leadingEngineerId: '2',
        workingScheduleId: '1',
        status: 'active'
      };

      const response = await request(app)
        .post('/api/customers')
        .send(customerData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(customerData.name);
      expect(response.body.contactInfo.email).toBe(customerData.contactInfo.email);
      expect(response.body.billingInfo.hourlyRate).toBe(customerData.billingInfo.hourlyRate);

      testCustomerId = response.body.id;
    });

    it('should validate required fields', async () => {
      const invalidData = {
        name: '', // Empty name
        contactInfo: {
          email: 'invalid-email' // Invalid email
        }
      };

      const response = await request(app)
        .post('/api/customers')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toHaveLength(2);
    });

    it('should validate email format', async () => {
      const invalidData = {
        name: 'Test Customer',
        contactInfo: {
          email: 'invalid-email-format'
        }
      };

      const response = await request(app)
        .post('/api/customers')
        .send(invalidData)
        .expect(400);

      expect(response.body.errors.some(error => 
        error.msg.includes('email')
      )).toBe(true);
    });

    it('should validate hourly rate is positive', async () => {
      const invalidData = {
        name: 'Test Customer',
        contactInfo: {
          email: 'test@example.com'
        },
        billingInfo: {
          hourlyRate: -50
        }
      };

      const response = await request(app)
        .post('/api/customers')
        .send(invalidData)
        .expect(400);

      expect(response.body.errors.some(error => 
        error.msg.includes('hourly rate')
      )).toBe(true);
    });
  });

  describe('PUT /api/customers/:id', () => {
    it('should update an existing customer', async () => {
      const updateData = {
        name: 'Updated Test Customer',
        contactInfo: {
          email: 'updated@example.com',
          phone: '+0987654321'
        },
        billingInfo: {
          hourlyRate: 150
        }
      };

      const response = await request(app)
        .put(`/api/customers/${testCustomerId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.contactInfo.email).toBe(updateData.contactInfo.email);
      expect(response.body.billingInfo.hourlyRate).toBe(updateData.billingInfo.hourlyRate);
    });

    it('should return 404 for non-existent customer', async () => {
      const updateData = {
        name: 'Updated Customer'
      };

      await request(app)
        .put('/api/customers/999999')
        .send(updateData)
        .expect(404);
    });

    it('should validate update data', async () => {
      const invalidData = {
        name: '', // Empty name
        contactInfo: {
          email: 'invalid-email'
        }
      };

      const response = await request(app)
        .put(`/api/customers/${testCustomerId}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('DELETE /api/customers/:id', () => {
    it('should archive a customer (soft delete)', async () => {
      const response = await request(app)
        .delete(`/api/customers/${testCustomerId}`)
        .expect(200);

      expect(response.body.message).toBe('Customer archived successfully');

      // Verify customer is archived
      const archivedCustomer = await db('customers')
        .where('id', testCustomerId)
        .first();
      
      expect(archivedCustomer.status).toBe('archived');
    });

    it('should return 404 for non-existent customer', async () => {
      await request(app)
        .delete('/api/customers/999999')
        .expect(404);
    });
  });

  describe('GET /api/customers/:id', () => {
    it('should return customer details', async () => {
      // Create a new customer for this test
      const customerData = {
        name: 'Detail Test Customer',
        contactInfo: {
          email: 'detail@example.com',
          phone: '+1234567890'
        },
        billingInfo: {
          hourlyRate: 100,
          currency: 'USD'
        },
        status: 'active'
      };

      const createResponse = await request(app)
        .post('/api/customers')
        .send(customerData)
        .expect(201);

      const customerId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/customers/${customerId}`)
        .expect(200);

      expect(response.body.id).toBe(customerId);
      expect(response.body.name).toBe(customerData.name);
      expect(response.body.contactInfo.email).toBe(customerData.contactInfo.email);
    });

    it('should return 404 for non-existent customer', async () => {
      await request(app)
        .get('/api/customers/999999')
        .expect(404);
    });
  });
}); 