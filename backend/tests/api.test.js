const request = require('supertest');
const app = require('../src/index');

describe('TiM API', () => {
  test('health check returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('create and list customers', async () => {
    const customerData = { name: 'Acme Ltd', hourlyRate: 100, currency: 'USD' };
    const createRes = await request(app).post('/customers').send(customerData);
    expect(createRes.statusCode).toBe(201);
    expect(createRes.body.name).toBe(customerData.name);
    const listRes = await request(app).get('/customers');
    expect(listRes.body.length).toBeGreaterThan(0);
  });

  test('time entry validation: minimum 0.5 hours', async () => {
    const timeEntry = { userId: 'user1', customerId: 'cust1', date: '2025-08-04', hours: 0.25 };
    const res = await request(app).post('/timeEntries').send(timeEntry);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/minimum time entry/i);
  });

  test('time entry rounding to nearest 0.5', async () => {
    const timeEntry = { userId: 'user1', customerId: 'cust1', date: '2025-08-04', hours: 1.3 };
    const res = await request(app).post('/timeEntries').send(timeEntry);
    expect(res.statusCode).toBe(201);
    expect(res.body.hours).toBe(1.5);
  });
});