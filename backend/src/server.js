const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const calendarRoutes = require('./routes/calendars');
const eventRoutes = require('./routes/events');
const adminRoutes = require('./routes/admin');
const { logAccessMiddleware } = require('./utils/accessLog');
const { initDbPool } = require('./utils/db');
const { scheduleReminders } = require('./utils/reminders');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

app.use(logAccessMiddleware);

app.use('/api/auth', authRoutes);
app.use('/api/calendars', calendarRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/docs', (req, res) => {
  res.json({
    auth: {
      login: { method: 'POST', path: '/api/auth/login' },
      me: { method: 'GET', path: '/api/auth/me' }
    },
    calendars: {
      list: { method: 'GET', path: '/api/calendars' },
      create: { method: 'POST', path: '/api/calendars' }
    },
    events: {
      list: { method: 'GET', path: '/api/events' },
      create: { method: 'POST', path: '/api/events' }
    },
    admin: {
      users: { method: 'GET', path: '/api/admin/users' },
      accessLogs: { method: 'GET', path: '/api/admin/access-logs' }
    }
  });
});

initDbPool();
scheduleReminders();

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

