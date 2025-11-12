const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const envPath = path.resolve(__dirname, 'config.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const donationRoutes = require('./routes/donations');
const requirementRoutes = require('./routes/requirements');

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || true,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint (supports both legacy `/health` and Vercel `/api/health`)
const healthCheckHandler = (req, res) => {
  res.json({
    status: 'OK',
    message: 'House of Charity API is running',
    timestamp: new Date().toISOString(),
    mode: process.env.USE_MOCK_DB === 'true' ? 'mock' : 'database',
  });
};
app.get('/health', healthCheckHandler);
app.get('/api/health', healthCheckHandler);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/requirements', requirementRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;

