const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

let pool;

function initDbPool() {
  if (pool) return pool;

  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'cal_user',
    password: process.env.DB_PASSWORD || 'changeme-password',
    database: process.env.DB_NAME || 'calendario_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: process.env.APP_TIMEZONE || 'Z'
  });

  return pool;
}

function getDb() {
  if (!pool) {
    throw new Error('DB pool not initialized. Call initDbPool() first.');
  }
  return pool;
}

module.exports = {
  initDbPool,
  getDb
};

