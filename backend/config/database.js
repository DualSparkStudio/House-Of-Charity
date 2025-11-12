const mysql = require('mysql2');
const path = require('path');
const fs = require('fs');

const shouldLoadLocalEnv = !process.env.VERCEL && !process.env.CI;
const envPath = path.resolve(__dirname, '../config.env');
if (shouldLoadLocalEnv && fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

if (process.env.USE_SUPABASE === 'true') {
  console.log('ℹ️ Supabase mode enabled. Skipping MySQL pool initialisation.');
  module.exports = {
    execute: async () => {
      throw new Error('MySQL database disabled because USE_SUPABASE=true');
    },
  };
  return;
}

// Create MySQL connection pool for better performance
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'house_of_charity',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000
});

// Test the connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
    return;
  }
  console.log('✅ Connected to MySQL database successfully!');
  connection.release();
});

// Export the promise-based version for async/await
module.exports = db.promise();
