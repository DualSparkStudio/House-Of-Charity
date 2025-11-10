const mysql = require('mysql2');
require('dotenv').config({ path: './config.env' });

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
