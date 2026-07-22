// test-jwt-secret.js - Test JWT_SECRET loading

import dotenv from 'dotenv';

// Load .env from project root (same as server.js)
dotenv.config({ path: '.env' });

console.log('🔍 Testing JWT_SECRET loading...');
console.log('JWT_SECRET loaded:', !!process.env.JWT_SECRET);
console.log('JWT_SECRET value:', process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 10) + '...' : 'NOT FOUND');
console.log('All env vars:', Object.keys(process.env).filter(key => key.startsWith('JWT')));
