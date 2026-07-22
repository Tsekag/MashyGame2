// test-role-access.js - Test script to verify role-based access control

import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

async function testRoleAccess() {
  console.log('🧪 Testing Role-Based Access Control...\n');

  try {
    // Test 1: Use existing regular user
    console.log('1️⃣ Using existing regular user...');
    
    // Test 2: Login as regular user
    console.log('\n2️⃣ Logging in as regular user...');
    const regularLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'mel@gmail.com',
      password: 'password123'
    });
    console.log('✅ Regular user login successful, role:', regularLogin.data.user.role);

    // Test 3: Try to access admin routes with regular user token
    console.log('\n3️⃣ Testing admin access with regular user token...');
    try {
      await axios.get(`${API_BASE}/admin/genres`, {
        headers: { Authorization: `Bearer ${regularLogin.data.token}` }
      });
      console.log('❌ ERROR: Regular user was able to access admin routes!');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ SUCCESS: Regular user correctly blocked from admin routes');
      } else {
        console.log('❌ Unexpected error:', error.response?.data);
      }
    }

    // Test 4: Login as admin user
    console.log('\n4️⃣ Logging in as admin user...');
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'barni@gmail.com',
      password: 'admin123'
    });
    console.log('✅ Admin user login successful, role:', adminLogin.data.user.role);

    // Test 5: Access admin routes with admin token
    console.log('\n5️⃣ Testing admin access with admin user token...');
    try {
      const adminGenres = await axios.get(`${API_BASE}/admin/genres`, {
        headers: { Authorization: `Bearer ${adminLogin.data.token}` }
      });
      console.log('✅ SUCCESS: Admin user can access admin routes');
      console.log('📊 Genres count:', adminGenres.data.genres.length);
    } catch (error) {
      console.log('❌ ERROR: Admin user could not access admin routes:', error.response?.data);
    }

    // Test 6: Try to access user routes with admin token
    console.log('\n6️⃣ Testing user route access with admin token...');
    try {
      await axios.get(`${API_BASE}/auth/profile`, {
        headers: { Authorization: `Bearer ${adminLogin.data.token}` }
      });
      console.log('✅ Admin user can access user routes (this is expected)');
    } catch (error) {
      console.log('❌ ERROR: Admin user could not access user routes:', error.response?.data);
    }

    console.log('\n🎉 Role-based access control test completed!');
    console.log('\n📝 Summary:');
    console.log('- Regular users: ❌ Cannot access admin routes');
    console.log('- Admin users: ✅ Can access admin routes');
    console.log('- Admin users: ✅ Can access user routes (but frontend will redirect them)');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testRoleAccess();
