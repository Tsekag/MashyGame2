// test-db-connection.js - Test database connection and user lookup

import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { pool } from './server/config/database.js';

// Load .env from server directory
dotenv.config({ path: './server/.env' });

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection and user lookup...\n');
    
    // Test database connection
    const [users] = await pool.execute('SELECT id, username, email, password_hash, role FROM users WHERE email = ?', ['barni@gmail.com']);
    
    if (users.length === 0) {
      console.log('❌ User not found in database');
      return;
    }
    
    const user = users[0];
    console.log('✅ User found in database:');
    console.log('ID:', user.id);
    console.log('Username:', user.username);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Password Hash:', user.password_hash);
    
    // Test password verification
    const password = '12345678';
    const isValid = await bcrypt.compare(password, user.password_hash);
    console.log(`\n🔑 Password "${password}" verification: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    
    // Test JWT_SECRET
    console.log('\n🔐 JWT_SECRET loaded:', !!process.env.JWT_SECRET);
    if (process.env.JWT_SECRET) {
      console.log('JWT_SECRET value:', process.env.JWT_SECRET.substring(0, 10) + '...');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await pool.end();
  }
}

testDatabase();

