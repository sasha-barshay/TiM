const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: 'postgres', // Connect to default database first
  });

  try {
    console.log('🔌 Connecting to PostgreSQL...');
    await client.connect();

    // Check if database exists
    const dbExists = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME || 'tim_dev']
    );

    if (dbExists.rows.length === 0) {
      console.log(`📦 Creating database: ${process.env.DB_NAME || 'tim_dev'}`);
      await client.query(`CREATE DATABASE ${process.env.DB_NAME || 'tim_dev'}`);
      console.log('✅ Database created successfully');
    } else {
      console.log('✅ Database already exists');
    }

    await client.end();

    // Connect to the new database and run schema
    const dbClient = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'tim_dev',
    });

    await dbClient.connect();
    console.log('📖 Reading schema file...');
    
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('🚀 Running database schema...');
    await dbClient.query(schema);
    console.log('✅ Database schema applied successfully');

    // Insert sample data
    console.log('🌱 Inserting sample data...');
    await insertSampleData(dbClient);
    console.log('✅ Sample data inserted successfully');

    await dbClient.end();
    console.log('🎉 Database setup completed successfully!');

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
    // Insert sample time entries
    await client.query(`
      INSERT INTO time_entries (user_id, customer_id, date, start_time, end_time, hours, description, status)
      VALUES 
        ($1, $2, CURRENT_DATE - INTERVAL '1 day', '09:00:00', '17:00:00', 8.0, 'Frontend development work', 'approved'),
        ($1, $3, CURRENT_DATE - INTERVAL '2 days', '10:00:00', '18:00:00', 8.0, 'Backend API development', 'submitted'),
        ($1, $2, CURRENT_DATE - INTERVAL '3 days', '08:30:00', '16:30:00', 8.0, 'Database optimization', 'draft')
      ON CONFLICT DO NOTHING;
    `, [users.rows[0].id, customers.rows[0].id, customers.rows[1].id]);
  }
}

if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase }; 