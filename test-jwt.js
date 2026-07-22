// test-jwt.js - Test JWT token decoding

import axios from 'axios';
import jwt from 'jsonwebtoken';

const API_BASE = 'http://localhost:3001/api';

async function testJWT() {
  try {
    console.log('🔍 Testing JWT Token...\n');
    
    // Login as admin
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'barni@gmail.com',
      password: 'admin123'
    });
    
    const token = adminLogin.data.token;
    console.log('✅ Admin login successful');
    console.log('🔑 Token received:', token.substring(0, 50) + '...');
    
    // Decode the token (without verification for testing)
    const decoded = jwt.decode(token);
    console.log('\n📋 Decoded JWT payload:');
    console.log(JSON.stringify(decoded, null, 2));
    
    // Check if role is in the token
    if (decoded.role) {
      console.log('\n✅ Role found in JWT:', decoded.role);
    } else {
      console.log('\n❌ Role NOT found in JWT token!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testJWT();

