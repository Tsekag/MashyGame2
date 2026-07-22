// reset-admin-password.js - Reset admin password

import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { pool } from './server/config/database.js';

dotenv.config();

async function resetAdminPassword() {
  try {
    console.log('🔧 Resetting admin password...\n');
    
    const adminEmail = 'barni@gmail.com';
    const newPassword = 'admin123';
    
    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 12);
    
    // Update the admin user's password
    const [result] = await pool.execute(
      'UPDATE users SET password_hash = ? WHERE email = ? AND role = ?',
      [passwordHash, adminEmail, 'admin']
    );
    
    if (result.affectedRows > 0) {
      console.log('✅ Admin password reset successfully!');
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`🔑 Password: ${newPassword}`);
    } else {
      console.log('❌ No admin user found to update');
    }
    
  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
  } finally {
    await pool.end();
  }
}

resetAdminPassword();

