// check-db.js - Check database users

import dotenv from 'dotenv';
import { pool } from './server/config/database.js';

dotenv.config();

async function checkDatabase() {
  try {
    console.log('🔍 Checking database users...\n');
    
    // Check if users table exists and get all users
    const [users] = await pool.execute('SELECT id, username, email, role FROM users');
    
    console.log('📊 Users in database:');
    console.log('==================');
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
    } else {
      users.forEach(user => {
        console.log(`ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Role: ${user.role || 'NULL'}`);
      });
    }
    
    // Check if admin user exists specifically
    const [adminUsers] = await pool.execute(
      'SELECT id, username, email, role FROM users WHERE email = ? OR role = ?',
      ['admin@mashupgame.com', 'admin']
    );
    
    console.log('\n👑 Admin users:');
    console.log('==============');
    
    if (adminUsers.length === 0) {
      console.log('❌ No admin users found');
    } else {
      adminUsers.forEach(user => {
        console.log(`ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Role: ${user.role || 'NULL'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabase();

