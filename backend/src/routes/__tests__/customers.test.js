const request = require('supertest');
const app = require('../../test/app');
const db = require('../../config/database');

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

      expect(response.body).toHaveProperty('customers');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('offset');
      expect(Array.isArray(response.body.customers)).toBe(true);
    });

    it('should filter customers by status', async () => {
      const response = await request(app)
        .get('/api/customers?status=active')
        .expect(200);

      expect(response.body.customers.every(customer => customer.status === 'active')).toBe(true);
    });

    it('should search customers by name', async () => {
      const response = await request(app)
        .get('/api/customers?search=test')
        .expect(200);

      expect(response.body.customers.every(customer => 
        customer.name.toLowerCase().includes('test')
      )).toBe(true);
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/customers?page=1&limit=5')
        .expect(200);

      expect(response.body.pagination.offset).toBe(0);
      expect(response.body.pagination.limit).toBe(5);
      expect(response.body.customers.length).toBeLessThanOrEqual(5);
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
        assignedUserIds: ['1051a830-55a0-4d82-86f4-4769d7a0624d', '795c73d8-5f60-45f7-b33e-9eaf5e8979e2'],
        accountManagerId: '1051a830-55a0-4d82-86f4-4769d7a0624d',
        leadingEngineerId: '795c73d8-5f60-45f7-b33e-9eaf5e8979e2',
        status: 'active'
      };

      const response = await request(app)
        .post('/api/customers')
        .send(customerData)
        .expect(201);

      expect(response.body).toHaveProperty('customer');
      expect(response.body.customer.name).toBe(customerData.name);
      expect(response.body.customer.contact_info.email).toBe(customerData.contactInfo.email);
      expect(response.body.customer.billing_info.hourlyRate).toBe(customerData.billingInfo.hourlyRate);

      testCustomerId = response.body.customer.id;
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

      expect(response.body).toHaveProperty('details');
      expect(response.body.details).toHaveLength(2);
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

      expect(response.body.details.some(error => 
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

      expect(response.body.details.some(error => 
        error.msg.includes('Hourly rate must be positive')
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

      expect(response.body.customer.name).toBe(updateData.name);
      expect(response.body.customer.contact_info.email).toBe(updateData.contactInfo.email);
      expect(response.body.customer.billing_info.hourlyRate).toBe(updateData.billingInfo.hourlyRate);
    });

    it('should return 404 for non-existent customer', async () => {
      const updateData = {
        name: 'Updated Customer'
      };

      await request(app)
        .put('/api/customers/00000000-0000-0000-0000-000000000000')
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

      expect(response.body).toHaveProperty('details');
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
        .delete('/api/customers/00000000-0000-0000-0000-000000000000')
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

      const customerId = createResponse.body.customer.id;

      const response = await request(app)
        .get(`/api/customers/${customerId}`)
        .expect(200);

      expect(response.body.customer.id).toBe(customerId);
      expect(response.body.customer.name).toBe(customerData.name);
      expect(response.body.customer.contact_info.email).toBe(customerData.contactInfo.email);
    });

    it('should return 404 for non-existent customer', async () => {
      await request(app)
        .get('/api/customers/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });
}); 