// test-actual-password.js - Test password for the actual hash in database

import bcrypt from 'bcryptjs';

const actualHashFromDB = '$2b$12$1m4fiSFYfdjDdloYJGWmwuOubodFEY57GaG9fKFME2mXWz4wf3uW6';

const passwordsToTest = [
  '12345678',
  'admin123', 
  'password',
  'barni',
  'admin',
  '123456',
  'password123',
  '123456789',
  'admin123456',
  'barni123',
  'test123',
  '12345',
  'qwerty'
];

console.log('🔍 Testing passwords for actual database hash...\n');

for (const password of passwordsToTest) {
  const isValid = await bcrypt.compare(password, actualHashFromDB);
  console.log(`Password: "${password}" - ${isValid ? '✅ MATCH' : '❌ No match'}`);
}

console.log('\n💡 If none match, we need to reset the password.');

