const bcrypt = require('bcryptjs');
const db = require('../src/config/database');

async function seedUsers() {
  try {
    console.log('🌱 Seeding users with hashed passwords...');

    const users = [
      {
        email: 'admin@tim.com',
        name: 'Admin User',
        password: 'password123',
        roles: ['admin'],
        timezone: 'UTC'
      },
      {
        email: 'manager@tim.com',
        name: 'Account Manager',
        password: 'password123',
        roles: ['account_manager'],
        timezone: 'UTC'
      },
      {
        email: 'engineer@tim.com',
        name: 'Engineer User',
        password: 'password123',
        roles: ['engineer'],
        timezone: 'UTC'
      }
    ];

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 12);
      
      await db('users')
        .insert({
          email: user.email,
          name: user.name,
          password_hash: hashedPassword,
          roles: user.roles,
          timezone: user.timezone,
          is_active: true
        })
        .onConflict('email')
        .merge(['name', 'password_hash', 'roles', 'timezone', 'is_active']);
      
      console.log(`✅ User ${user.email} seeded successfully`);
    }

    console.log('🎉 All users seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin: admin@tim.com / password123');
    console.log('Manager: manager@tim.com / password123');
    console.log('Engineer: engineer@tim.com / password123');

  } catch (error) {
    console.error('❌ Error seeding users:', error);
  } finally {
    await db.destroy();
  }
}

if (require.main === module) {
  seedUsers();
}

module.exports = { seedUsers }; 