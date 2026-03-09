const bcrypt = require('bcrypt');
const { getDb } = require('./db');

async function ensureDefaultAdmin() {
  try {
    const db = getDb();

    const username = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
    const email = process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';

    const passwordHash = await bcrypt.hash(password, 10);

    await db.execute(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES (?, ?, ?, 'admin')
       ON DUPLICATE KEY UPDATE
         email = VALUES(email),
         password_hash = VALUES(password_hash),
         role = VALUES(role)`,
      [username, email, passwordHash]
    );

    console.log(`Default admin ensured: ${username}`);
  } catch (err) {
    console.error('Failed to ensure default admin user', err);
  }
}

module.exports = {
  ensureDefaultAdmin
};

