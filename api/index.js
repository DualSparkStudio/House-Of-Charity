"use strict";

const serverless = require("serverless-http");
const path = require("path");
const fs = require("fs");

// Load environment variables for local development
const envPath = path.resolve(__dirname, "../backend/config.env");
if (fs.existsSync(envPath)) {
  require("dotenv").config({ path: envPath });
}

const app = require("../backend/app");

module.exports = serverless(app);
const path = require('path');
const serverless = require('serverless-http');

// Ensure backend environment variables are loaded, even on Vercel
const backendEnvPath = path.join(__dirname, '../backend/config.env');
require('dotenv').config({ path: backendEnvPath });

if (!process.env.FRONTEND_URL && process.env.VERCEL_URL) {
  process.env.FRONTEND_URL = `https://${process.env.VERCEL_URL}`;
}

const app = require('../backend/app');

module.exports = serverless(app);
const serverless = require('serverless-http');
const path = require('path');

// Ensure backend env variables are loaded when running on Vercel
require('dotenv').config({ path: path.join(process.cwd(), 'backend', 'config.env') });

const app = require('../backend/app');

module.exports = serverless(app);

