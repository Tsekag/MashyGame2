// test-password.js - Test different passwords for barni

import bcrypt from 'bcryptjs';

const hashFromDB = '$2b$12$tHQXPN.nkFbtQRUs6h8jpu1dbqZGTaxC56um1QzC4X8jziRkatlAy';

const passwordsToTest = [
  '12345678',
  'admin123', 
  'password',
  'barni',
  'admin',
  '123456',
  'password123'
];

console.log('🔍 Testing passwords for barni...\n');

for (const password of passwordsToTest) {
  const isValid = await bcrypt.compare(password, hashFromDB);
  console.log(`Password: "${password}" - ${isValid ? '✅ MATCH' : '❌ No match'}`);
}

console.log('\n💡 If none match, the password might be something else.');

