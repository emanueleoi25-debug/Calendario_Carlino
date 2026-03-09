const { getDb } = require('./db');

async function logAccess(userId, action, ipAddress) {
  try {
    const db = getDb();
    await db.execute(
      'INSERT INTO access_logs (user_id, action, ip_address) VALUES (?, ?, ?)',
      [userId || null, action, ipAddress || null]
    );
  } catch (err) {
    console.error('Failed to log access', err.message);
  }
}

function logAccessMiddleware(req, res, next) {
  res.on('finish', () => {
    const userId = req.user ? req.user.id : null;
    const action = `${req.method} ${req.originalUrl} -> ${res.statusCode}`;
    const ipAddress = req.ip || req.connection.remoteAddress;
    logAccess(userId, action, ipAddress);
  });
  next();
}

module.exports = {
  logAccess,
  logAccessMiddleware
};

