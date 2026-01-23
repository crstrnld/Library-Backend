// routes/index.js
const express = require('express');
const authRoutes = require('./auth');
const bookRoutes = require('./books');
const borrowRoutes = require('./borrow');
const userRoutes = require('./users');

const router = express.Router();

// Gabungkan semua routes di sini
router.use('/auth', authRoutes);
router.use('/books', bookRoutes);
router.use('/borrow', borrowRoutes);
router.use('/users', userRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
