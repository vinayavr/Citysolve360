const User = require('./models/User');

async function test() {
  try {
    console.log('Testing User model...');
    const user = await User.findByEmail('nonexistent@test.com');
    console.log('✅ User model works! Result:', user);
  } catch (error) {
    console.error('❌ User model error:', error);
  }
}

test();