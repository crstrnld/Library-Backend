const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('./config/database');
const routes = require('./routes');
const errorHandlerMiddleware = require('./middlewares/errorHandler');
const loggerMiddleware = require('./middlewares/logger');
require('dotenv').config();

const app = express();

// ==========================================
// CORS CONFIGURATION
// ==========================================
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'https://letssgominjambukuuu.up.railway.app',
  'https://letssgominjambukuuu.up.railway.app/',
];

const corsOptions = {
  origin: function (origin, callback) {
    console.log('🔒 CORS Check - Origin:', origin);
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('❌ CORS Blocked:', origin);
      callback(null, true); // Allow untuk debugging
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
  maxAge: 86400,
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(loggerMiddleware);

// ==========================================
// HEALTH CHECK ENDPOINT
// ==========================================
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ==========================================
// API ROUTES
// ==========================================
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  console.log('❌ 404 - Route not found:', req.method, req.originalUrl);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// Error handler
app.use(errorHandlerMiddleware);

// ==========================================
// START SERVER
// ==========================================
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Sync models
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('✅ Database models synchronized');

    // Start server
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════╗
║  🚀 SERVER STARTED SUCCESSFULLY           ║
╠════════════════════════════════════════════╣
║  Port: ${PORT}
║  Environment: ${process.env.NODE_ENV}
║  Frontend: ${process.env.FRONTEND_URL}
║  Allowed Origins: ${allowedOrigins.length} origins
╚════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
