const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  return transporter;
}

async function sendEventReminderEmail(to, event, calendar) {
  const from = process.env.SMTP_FROM || 'no-reply@example.com';
  const subject = `Promemoria evento: ${event.title}`;

  const start = new Date(event.start_datetime).toLocaleString('it-IT', {
    timeZone: process.env.APP_TIMEZONE || 'Europe/Rome'
  });
  const end = new Date(event.end_datetime).toLocaleString('it-IT', {
    timeZone: process.env.APP_TIMEZONE || 'Europe/Rome'
  });

  const html = `
    <h2>Promemoria evento</h2>
    <p><strong>Calendario:</strong> ${calendar.name}</p>
    <p><strong>Titolo:</strong> ${event.title}</p>
    <p><strong>Descrizione:</strong> ${event.description || '-'}</p>
    <p><strong>Inizio:</strong> ${start}</p>
    <p><strong>Fine:</strong> ${end}</p>
  `;

  await getTransporter().sendMail({
    from,
    to,
    subject,
    html
  });
}

module.exports = {
  sendEventReminderEmail
};

