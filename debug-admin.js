// debug-admin.js - Debug admin middleware

import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

async function debugAdmin() {
  try {
    console.log('🔍 Debugging Admin Middleware...\n');
    
    // Login as admin
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'barni@gmail.com',
      password: 'admin123'
    });
    
    console.log('✅ Admin login successful');
    console.log('👤 User from login response:', adminLogin.data.user);
    
    // Try to access admin route
    console.log('\n🔍 Testing admin route access...');
    try {
      const response = await axios.get(`${API_BASE}/admin/genres`, {
        headers: { Authorization: `Bearer ${adminLogin.data.token}` }
      });
      console.log('✅ SUCCESS: Admin route accessible');
      console.log('📊 Response:', response.data);
    } catch (error) {
      console.log('❌ ERROR accessing admin route:');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data);
      
      // Let's also test the profile endpoint to see if the user object is correct
      console.log('\n🔍 Testing profile endpoint...');
      try {
        const profileResponse = await axios.get(`${API_BASE}/auth/profile`, {
          headers: { Authorization: `Bearer ${adminLogin.data.token}` }
        });
        console.log('✅ Profile accessible');
        console.log('👤 User from profile:', profileResponse.data.user);
      } catch (profileError) {
        console.log('❌ Profile error:', profileError.response?.data);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

debugAdmin();

