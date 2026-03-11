const express = require('express');
const { getDb } = require('../utils/db');
const { authMiddleware } = require('../utils/auth');

const router = express.Router();

// Converte stringhe ISO (es. 2026-03-11T08:00:00.000Z) in formato DATETIME MySQL (YYYY-MM-DD HH:MM:SS)
function toMySQLDateTime(value) {
  if (!value) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return value;
  }

  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  const mm = pad(d.getUTCMonth() + 1);
  const dd = pad(d.getUTCDate());
  const hh = pad(d.getUTCHours());
  const mi = pad(d.getUTCMinutes());
  const ss = pad(d.getUTCSeconds());
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

router.use(authMiddleware);

async function canManageCalendar(user, calendar) {
  if (calendar.type === 'office') {
    return user.role === 'admin';
  }
  if (calendar.type === 'private') {
    return calendar.owner_user_id === user.id;
  }
  if (calendar.type === 'sub-office') {
    return user.role === 'admin';
  }
  return false;
}

async function validateNoOverlap(db, userId, start, end, isAllDay, excludeEventId) {
  if (isAllDay) return true;

  const startDb = toMySQLDateTime(start);
  const endDb = toMySQLDateTime(end);

  const params = [userId, endDb, startDb];
  let query = `
    SELECT COUNT(*) AS cnt
    FROM events
    WHERE created_by_user_id = ?
      AND is_all_day = 0
      AND start_datetime < ?
      AND end_datetime > ?
  `;

  if (excludeEventId) {
    query += ' AND id <> ?';
    params.push(excludeEventId);
  }

  const [rows] = await db.execute(query, params);
  return rows[0].cnt === 0;
}

router.get('/', async (req, res) => {
  const { calendarId, from, to } = req.query;

  try {
    const db = getDb();
    let query = `
      SELECT e.*
      FROM events e
      JOIN calendars c ON e.calendar_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (calendarId) {
      query += ' AND e.calendar_id = ?';
      params.push(calendarId);
    }
    if (from) {
      query += ' AND e.end_datetime >= ?';
      params.push(from);
    }
    if (to) {
      query += ' AND e.start_datetime <= ?';
      params.push(to);
    }

    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore server' });
  }
});

router.post('/', async (req, res) => {
  const { calendar_id, title, description, start_datetime, end_datetime, is_all_day } = req.body;
  if (!calendar_id || !title || !start_datetime || !end_datetime) {
    return res.status(400).json({ message: 'Dati evento incompleti' });
  }

  try {
    const db = getDb();
    const [calRows] = await db.execute('SELECT * FROM calendars WHERE id = ?', [calendar_id]);
    const calendar = calRows[0];
    if (!calendar) {
      return res.status(404).json({ message: 'Calendario non trovato' });
    }

    if (!(await canManageCalendar(req.user, calendar))) {
      return res.status(403).json({ message: 'Non hai i permessi per questo calendario' });
    }

    const startDb = toMySQLDateTime(start_datetime);
    const endDb = toMySQLDateTime(end_datetime);

    const ok = await validateNoOverlap(db, req.user.id, startDb, endDb, !!is_all_day);
    if (!ok) {
      return res.status(400).json({ message: 'Evento in conflitto con un altro evento' });
    }

    const [result] = await db.execute(
      `
      INSERT INTO events
        (calendar_id, title, description, start_datetime, end_datetime, is_all_day, created_by_user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        calendar_id,
        title,
        description || null,
        startDb,
        endDb,
        is_all_day ? 1 : 0,
        req.user.id
      ]
    );

    const [rows] = await db.execute('SELECT * FROM events WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore server' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, start_datetime, end_datetime, is_all_day } = req.body;

  try {
    const db = getDb();
    const [rows] = await db.execute(
      `
      SELECT
        e.*,
        c.type AS calendar_type,
        c.owner_user_id AS calendar_owner_user_id
      FROM events e
      JOIN calendars c ON e.calendar_id = c.id
      WHERE e.id = ?
      `,
      [id]
    );
    const event = rows[0];
    if (!event) {
      return res.status(404).json({ message: 'Evento non trovato' });
    }

    const calendar = {
      id: event.calendar_id,
      type: event.calendar_type,
      owner_user_id: event.calendar_owner_user_id
    };
    if (!(await canManageCalendar(req.user, calendar))) {
      return res.status(403).json({ message: 'Non hai i permessi per questo evento' });
    }

    const newStart = start_datetime ? toMySQLDateTime(start_datetime) : event.start_datetime;
    const newEnd = end_datetime ? toMySQLDateTime(end_datetime) : event.end_datetime;
    const newAllDay = typeof is_all_day === 'boolean' ? is_all_day : !!event.is_all_day;

    const ok = await validateNoOverlap(db, req.user.id, newStart, newEnd, newAllDay, id);
    if (!ok) {
      return res.status(400).json({ message: 'Evento in conflitto con un altro evento' });
    }

    await db.execute(
      `
      UPDATE events
      SET title = ?, description = ?, start_datetime = ?, end_datetime = ?, is_all_day = ?
      WHERE id = ?
      `,
      [
        title || event.title,
        description || event.description,
        newStart,
        newEnd,
        newAllDay ? 1 : 0,
        id
      ]
    );

    const [updated] = await db.execute('SELECT * FROM events WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore server' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const db = getDb();
    const [rows] = await db.execute(
      `
      SELECT
        e.*,
        c.type AS calendar_type,
        c.owner_user_id AS calendar_owner_user_id
      FROM events e
      JOIN calendars c ON e.calendar_id = c.id
      WHERE e.id = ?
      `,
      [id]
    );
    const event = rows[0];
    if (!event) {
      return res.status(404).json({ message: 'Evento non trovato' });
    }

    const calendar = {
      id: event.calendar_id,
      type: event.calendar_type,
      owner_user_id: event.calendar_owner_user_id
    };
    if (!(await canManageCalendar(req.user, calendar))) {
      return res.status(403).json({ message: 'Non hai i permessi per eliminare questo evento' });
    }

    await db.execute('DELETE FROM events WHERE id = ?', [id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore server' });
  }
});

module.exports = router;

