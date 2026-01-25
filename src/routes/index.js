const express = require('express');
const authRoutes = require('./auth');
const userRoutes = require('./users');
const bookRoutes = require('./books');
const borrowRoutes = require('./borrow');

const router = express.Router();

console.log('📍 Setting up API routes...');

// Root API endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/auth',
      users: '/users',
      books: '/books',
      borrow: '/borrow',
    },
  });
});

console.log('✅ Root route registered');

// Auth routes
try {
  router.use('/auth', authRoutes);
  console.log('✅ Auth routes registered');
} catch (e) {
  console.error('❌ Error loading auth routes:', e.message);
}

// User routes
try {
  router.use('/users', userRoutes);
  console.log('✅ User routes registered');
} catch (e) {
  console.error('❌ Error loading user routes:', e.message);
}

// Book routes
try {
  router.use('/books', bookRoutes);
  console.log('✅ Book routes registered');
} catch (e) {
  console.error('❌ Error loading book routes:', e.message);
}

// Borrow routes
try {
  router.use('/borrow', borrowRoutes);
  console.log('✅ Borrow routes registered');
} catch (e) {
  console.error('❌ Error loading borrow routes:', e.message);
}

module.exports = router;
