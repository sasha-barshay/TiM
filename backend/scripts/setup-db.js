const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  const isTest = process.env.NODE_ENV === 'test';
  const dbName = isTest ? (process.env.TEST_DB_NAME || 'tim_test') : (process.env.DB_NAME || 'tim_dev');
  const dbHost = isTest ? (process.env.TEST_DB_HOST || 'localhost') : (process.env.DB_HOST || 'localhost');
  const dbPort = isTest ? (process.env.TEST_DB_PORT || 5432) : (process.env.DB_PORT || 5432);
  const dbUser = isTest ? (process.env.TEST_DB_USER || 'postgres') : (process.env.DB_USER || 'postgres');
  const dbPassword = isTest ? (process.env.TEST_DB_PASSWORD || 'password') : (process.env.DB_PASSWORD || 'password');

  const client = new Client({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: 'postgres', // Connect to default database first
  });

  try {
    
    await client.connect();

    // Check if database exists
    const dbExists = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );

    if (dbExists.rows.length === 0) {
      await client.query(`CREATE DATABASE ${dbName}`);
    }

    await client.end();

    // Connect to the new database and run schema
    const dbClient = new Client({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      database: dbName,
    });

    await dbClient.connect();
    
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await dbClient.query(schema);

    // Insert sample data
    await insertSampleData(dbClient);

    await dbClient.end();

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

async function insertSampleData(client) {
  // Insert sample customers
  await client.query(`
    INSERT INTO customers (name, contact_info, billing_info, status)
    VALUES 
      ('Acme Corp', '{"email": "contact@acme.com", "phone": "+1-555-0101", "address": "123 Business St, City, State"}', '{"hourly_rate": 150.00, "currency": "USD", "payment_terms": "Net 30"}', 'active'),
      ('TechStart Inc', '{"email": "hello@techstart.com", "phone": "+1-555-0102", "address": "456 Innovation Ave, Tech City, State"}', '{"hourly_rate": 200.00, "currency": "USD", "payment_terms": "Net 15"}', 'active'),
      ('Global Solutions', '{"email": "info@globalsolutions.com", "phone": "+1-555-0103", "address": "789 Enterprise Blvd, Metro City, State"}', '{"hourly_rate": 175.00, "currency": "USD", "payment_terms": "Net 30"}', 'active')
    ON CONFLICT DO NOTHING;
  `);

  // Insert sample users (password: 'password123')
  await client.query(`
    INSERT INTO users (email, name, roles, timezone)
    VALUES 
      ('admin@tim.com', 'Admin User', ARRAY['admin'], 'UTC'),
      ('manager@tim.com', 'Account Manager', ARRAY['account_manager'], 'UTC'),
      ('engineer@tim.com', 'Engineer User', ARRAY['engineer'], 'UTC')
    ON CONFLICT (email) DO NOTHING;
  `);

  // Get user IDs for time entries
  const users = await client.query('SELECT id, email FROM users');
  const customers = await client.query('SELECT id, name FROM customers');

  if (users.rows.length > 0 && customers.rows.length > 0) {
    // Insert comprehensive sample time entries for dashboard testing
    const adminUserId = users.rows[0].id;
    const managerUserId = users.rows[1].id;
    const engineerUserId = users.rows[2].id;
    const acmeCustomerId = customers.rows[0].id;
    const techStartCustomerId = customers.rows[1].id;
    const globalCustomerId = customers.rows[2].id;

    await client.query(`
      INSERT INTO time_entries (user_id, customer_id, date, start_time, end_time, hours, description, status)
      VALUES 
        -- Recent entries for current month
        ($1, $2, CURRENT_DATE - INTERVAL '1 day', '09:00:00', '17:00:00', 8.0, 'Frontend development work', 'approved'),
        ($1, $3, CURRENT_DATE - INTERVAL '2 days', '10:00:00', '18:00:00', 8.0, 'Backend API development', 'submitted'),
        ($1, $2, CURRENT_DATE - INTERVAL '3 days', '08:30:00', '16:30:00', 8.0, 'Database optimization', 'draft'),
        ($1, $4, CURRENT_DATE - INTERVAL '4 days', '09:00:00', '17:00:00', 8.0, 'UI/UX design work', 'approved'),
        ($1, $2, CURRENT_DATE - INTERVAL '5 days', '10:00:00', '18:00:00', 8.0, 'Testing and debugging', 'approved'),
        ($1, $3, CURRENT_DATE - INTERVAL '6 days', '09:00:00', '17:00:00', 8.0, 'Code review and refactoring', 'submitted'),
        ($1, $2, CURRENT_DATE - INTERVAL '7 days', '08:00:00', '16:00:00', 8.0, 'Documentation updates', 'approved'),
        ($1, $4, CURRENT_DATE - INTERVAL '8 days', '10:00:00', '18:00:00', 8.0, 'Performance optimization', 'draft'),
        ($1, $3, CURRENT_DATE - INTERVAL '9 days', '09:00:00', '17:00:00', 8.0, 'Security audit', 'approved'),
        ($1, $2, CURRENT_DATE - INTERVAL '10 days', '10:00:00', '18:00:00', 8.0, 'Feature implementation', 'approved'),
        
        -- Additional entries for different users
        ($5, $2, CURRENT_DATE - INTERVAL '1 day', '09:00:00', '17:00:00', 8.0, 'Project planning', 'approved'),
        ($5, $3, CURRENT_DATE - INTERVAL '2 days', '10:00:00', '18:00:00', 8.0, 'Client meeting', 'approved'),
        ($6, $2, CURRENT_DATE - INTERVAL '1 day', '09:00:00', '17:00:00', 8.0, 'System maintenance', 'approved'),
        ($6, $4, CURRENT_DATE - INTERVAL '3 days', '10:00:00', '18:00:00', 8.0, 'Bug fixes', 'submitted'),
        
        -- Historical data for trends (previous month)
        ($1, $2, CURRENT_DATE - INTERVAL '35 days', '09:00:00', '17:00:00', 8.0, 'Legacy system work', 'approved'),
        ($1, $3, CURRENT_DATE - INTERVAL '36 days', '10:00:00', '18:00:00', 8.0, 'Data migration', 'approved'),
        ($1, $4, CURRENT_DATE - INTERVAL '37 days', '09:00:00', '17:00:00', 8.0, 'Infrastructure setup', 'approved'),
        ($5, $2, CURRENT_DATE - INTERVAL '38 days', '10:00:00', '18:00:00', 8.0, 'Requirements analysis', 'approved'),
        ($6, $3, CURRENT_DATE - INTERVAL '39 days', '09:00:00', '17:00:00', 8.0, 'Deployment preparation', 'approved')
      ON CONFLICT DO NOTHING;
    `, [adminUserId, acmeCustomerId, techStartCustomerId, globalCustomerId, managerUserId, engineerUserId]);
  }
}

if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase }; 