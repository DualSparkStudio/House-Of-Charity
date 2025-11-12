"use strict";

const path = require("path");
const fs = require("fs");

const shouldLoadLocalEnv = !process.env.VERCEL && !process.env.CI;
const envPath = path.resolve(process.cwd(), "backend/config.env");
if (shouldLoadLocalEnv && fs.existsSync(envPath)) {
  require("dotenv").config({ path: envPath });
}

if (!process.env.FRONTEND_URL && process.env.VERCEL_URL) {
  process.env.FRONTEND_URL = `https://${process.env.VERCEL_URL}`;
}

const app = require("../backend/app");

module.exports = app;
module.exports.default = app;
