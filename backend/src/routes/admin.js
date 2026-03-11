const express = require('express');
const { getDb } = require('../utils/db');
const { authMiddleware, requireAdmin } = require('../utils/auth');

const router = express.Router();

// Assicura l'esistenza della tabella di collegamento
// tra sotto-uffici e calendari dedicati.
async function ensureSubOfficeCalendarsTable(db) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sub_office_calendars (
      sub_office_id INT UNSIGNED NOT NULL PRIMARY KEY,
      calendar_id INT UNSIGNED NOT NULL UNIQUE,
      CONSTRAINT fk_soc_sub_office
        FOREIGN KEY (sub_office_id) REFERENCES sub_offices(id)
        ON DELETE CASCADE,
      CONSTRAINT fk_soc_calendar
        FOREIGN KEY (calendar_id) REFERENCES calendars(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);
}

router.use(authMiddleware);
router.use(requireAdmin);

router.get('/users', async (req, res) => {
  try {
    const db = getDb();
    const [rows] = await db.execute(
      'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore server' });
  }
});

router.post('/users', async (req, res) => {
  const { username, email, password, role } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Dati utente incompleti' });
  }

  try {
    const db = getDb();
    const [result] = await db.execute(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [username, email, password, role === 'admin' ? 'admin' : 'user']
    );
    const [rows] = await db.execute(
      'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore server' });
  }
});

router.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['admin', 'user'].includes(role)) {
    return res.status(400).json({ message: 'Ruolo non valido' });
  }

  try {
    const db = getDb();
    await db.execute('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    const [rows] = await db.execute(
      'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
      [id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore server' });
  }
});

// Elimina completamente un utente (eventi, permessi e appartenenze
// ai sotto-uffici vengono gestiti dai vincoli ON DELETE del DB).
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const db = getDb();
    await db.execute('DELETE FROM users WHERE id = ?', [id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore server' });
  }
});

router.get('/access-logs', async (req, res) => {
  try {
    const db = getDb();
    const [rows] = await db.execute(
      `
      SELECT l.*, u.username
      FROM access_logs l
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.timestamp DESC
      LIMIT 500
      `
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore server' });
  }
});

router.get('/sub-offices', async (req, res) => {
  try {
    const db = getDb();
    const [rows] = await db.execute(
      `
      SELECT s.id, s.name, s.parent_office_id, s.created_at,
             COUNT(us.user_id) AS users_count
      FROM sub_offices s
      LEFT JOIN user_sub_offices us ON us.sub_office_id = s.id
      GROUP BY s.id
      ORDER BY s.name ASC
      `
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore server' });
  }
});

router.post('/sub-offices', async (req, res) => {
  const { name, parent_office_id } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Nome richiesto' });
  }

  try {
    const db = getDb();
    await ensureSubOfficeCalendarsTable(db);

    // Creo sotto-ufficio
    const [subResult] = await db.execute(
      'INSERT INTO sub_offices (name, parent_office_id) VALUES (?, ?)',
      [name, parent_office_id || null]
    );
    const subOfficeId = subResult.insertId;

    // Creo calendario dedicato
    const [calResult] = await db.execute(
      'INSERT INTO calendars (name, type, owner_user_id, color) VALUES (?, ?, ?, ?)',
      [name, 'sub-office', null, '#22c55e'] // verde per i sotto-uffici
    );
    const calendarId = calResult.insertId;

    // Collego sotto-ufficio e calendario
    await db.execute(
      'INSERT INTO sub_office_calendars (sub_office_id, calendar_id) VALUES (?, ?)',
      [subOfficeId, calendarId]
    );

    const [rows] = await db.execute(
      'SELECT id, name, parent_office_id, created_at FROM sub_offices WHERE id = ?',
      [subOfficeId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore server' });
  }
});

router.delete('/sub-offices/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const db = getDb();
    await ensureSubOfficeCalendarsTable(db);

    // Verifico se esistono eventi associati al calendario del sotto-ufficio
    const [infoRows] = await db.execute(
      `
      SELECT c.id AS calendar_id, COUNT(e.id) AS events_count
      FROM sub_offices s
      LEFT JOIN sub_office_calendars soc ON soc.sub_office_id = s.id
      LEFT JOIN calendars c ON c.id = soc.calendar_id
      LEFT JOIN events e ON e.calendar_id = c.id
      WHERE s.id = ?
      GROUP BY c.id
      `,
      [id]
    );

    if (infoRows.length && infoRows[0].events_count > 0) {
      return res
        .status(400)
        .json({ message: 'Impossibile eliminare sotto-ufficio con eventi associati' });
    }

    const calendarId = infoRows.length ? infoRows[0].calendar_id : null;

    // Elimino membri, eventuale legame e calendario, poi il sotto-ufficio
    await db.execute('DELETE FROM user_sub_offices WHERE sub_office_id = ?', [id]);
    if (calendarId) {
      await db.execute('DELETE FROM sub_office_calendars WHERE sub_office_id = ?', [id]);
      await db.execute('DELETE FROM calendars WHERE id = ?', [calendarId]);
    }
    await db.execute('DELETE FROM sub_offices WHERE id = ?', [id]);

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore server' });
  }
});

router.get('/sub-offices/:id/users', async (req, res) => {
  const { id } = req.params;
  try {
    const db = getDb();
    const [rows] = await db.execute(
      `
      SELECT u.id, u.username, u.email, u.role
      FROM user_sub_offices us
      JOIN users u ON us.user_id = u.id
      WHERE us.sub_office_id = ?
      ORDER BY u.username ASC
      `,
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore server' });
  }
});

router.post('/sub-offices/:id/users', async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;
  if (!user_id) {
    return res.status(400).json({ message: 'user_id richiesto' });
  }

  try {
    const db = getDb();
    await db.execute(
      'INSERT IGNORE INTO user_sub_offices (user_id, sub_office_id) VALUES (?, ?)',
      [user_id, id]
    );
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore server' });
  }
});

router.delete('/sub-offices/:id/users/:userId', async (req, res) => {
  const { id, userId } = req.params;
  try {
    const db = getDb();
    await db.execute(
      'DELETE FROM user_sub_offices WHERE sub_office_id = ? AND user_id = ?',
      [id, userId]
    );
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore server' });
  }
});

module.exports = router;

