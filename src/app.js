const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('./config/database');
const routes = require('./routes');
const errorHandlerMiddleware = require('./middlewares/errorHandler');
const loggerMiddleware = require('./middlewares/logger');
require('dotenv').config();

const app = express();

// CORS Configuration
const corsOptions = {
  origin:
    process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL || 'letssgominjambukuuu.up.railway.app'
      : [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:3001',
        ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggerMiddleware);

// Serve static files (cover buku)
app.use('/uploads/books', express.static(path.join(__dirname, '../uploads/books')));

// Routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handling middleware
app.use(errorHandlerMiddleware);

// Database sync and server start
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync();
      console.log('✅ Database models synchronized (development mode)');
    } else {
      await sequelize.sync();
      console.log('✅ Database models synchronized (production mode)');
    }

    app.listen(PORT, () => {
      const origins = Array.isArray(corsOptions.origin)
        ? corsOptions.origin.join(', ')
        : corsOptions.origin;
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
      console.log(`📝 API available at http://localhost:${PORT}/api`);
      console.log(`🔒 CORS enabled for: ${origins}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;

