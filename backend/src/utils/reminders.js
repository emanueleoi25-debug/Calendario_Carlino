const cron = require('node-cron');
const { getDb } = require('./db');
const { sendEventReminderEmail } = require('./email');

async function processReminders() {
  const db = getDb();
  const now = new Date();

  const windows = [
    { minutes: 60, label: '1h' },
    { minutes: 24 * 60, label: '24h' }
  ];

  for (const window of windows) {
    const start = new Date(now.getTime() + window.minutes * 60 * 1000 - 5 * 60 * 1000);
    const end = new Date(now.getTime() + window.minutes * 60 * 1000 + 5 * 60 * 1000);

    const [rows] = await db.execute(
      `
      SELECT e.*, c.name AS calendar_name, u.email AS user_email
      FROM events e
      JOIN calendars c ON e.calendar_id = c.id
      JOIN users u ON e.created_by_user_id = u.id
      WHERE e.start_datetime BETWEEN ? AND ?
      `,
      [start, end]
    );

    for (const row of rows) {
      try {
        await sendEventReminderEmail(
          row.user_email,
          row,
          { name: row.calendar_name }
        );
      } catch (err) {
        console.error('Failed to send reminder', err.message);
      }
    }
  }
}

function scheduleReminders() {
  cron.schedule('*/5 * * * *', () => {
    processReminders().catch((err) =>
      console.error('Error processing reminders', err.message)
    );
  });
}

module.exports = {
  scheduleReminders
};

