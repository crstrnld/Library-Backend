const bcrypt = require('bcryptjs');

async function generateHash() {
  const passwords = [
    'password123456',
    'newpassword123456',
  ];

  for (const password of passwords) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    console.log(`\nPassword: ${password}`);
    console.log(`Hash: ${hash}`);
    
    // Test hash
    const isMatch = await bcrypt.compare(password, hash);
    console.log(`Match test: ${isMatch ?  '✅ OK' : '❌ FAILED'}`);
  }
}

generateHash().catch(console.error);