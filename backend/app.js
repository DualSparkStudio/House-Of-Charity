const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const shouldLoadLocalEnv = !process.env.VERCEL && !process.env.CI;
const envPath = path.resolve(__dirname, 'config.env');
if (shouldLoadLocalEnv && fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const donationRoutes = require('./routes/donations');
const requirementRoutes = require('./routes/requirements');
const { useSupabase, supabaseClient } = require('./utils/dbMode');

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

// Database connectivity status endpoint
app.get('/api/db-status', async (req, res) => {
  const mode =
    process.env.USE_MOCK_DB === 'true'
      ? 'mock'
      : useSupabase()
      ? 'supabase'
      : 'mysql';

  const payload = {
    mode,
    supabase: {
      enabled: useSupabase(),
      connected: false,
    },
  };

  if (useSupabase() && supabaseClient) {
    try {
      const { data, error, count } = await supabaseClient
        .from('donations')
        .select('id', { count: 'exact', limit: 1 });

      if (error) {
        throw error;
      }

      payload.supabase.connected = true;
      payload.supabase.sampleCount =
        typeof count === 'number' ? count : data?.length ?? 0;
    } catch (err) {
      payload.supabase.error = err?.message || 'Unknown Supabase error';
    }
  }

  res.json(payload);
});

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

