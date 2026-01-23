const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'password123456';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  
  console.log('Password:', password);
  console.log('Hash:', hash);
  
  // Test if hash matches
  const isMatch = await bcrypt.compare(password, hash);
  console.log('Match test:', isMatch ?  '✅ OK' : '❌ FAILED');
}

generateHash();