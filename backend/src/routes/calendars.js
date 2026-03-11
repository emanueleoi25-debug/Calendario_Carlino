const express = require('express');
const { getDb } = require('../utils/db');
const { authMiddleware } = require('../utils/auth');

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

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    await ensureSubOfficeCalendarsTable(db);

    let rows;

    if (req.user.role === 'admin') {
      // L'admin vede tutti i calendari di ufficio e sotto-ufficio,
      // più i propri privati ed eventuali permessi espliciti.
      [rows] = await db.execute(
        `
        SELECT c.*
        FROM calendars c
        LEFT JOIN calendar_permissions p ON p.calendar_id = c.id
        WHERE
          c.type IN ('office', 'sub-office')
          OR (c.type = 'private' AND c.owner_user_id = ?)
          OR (p.user_id = ?)
        GROUP BY c.id
        `,
        [req.user.id, req.user.id]
      );
    } else {
      // Gli utenti normali vedono:
      // - calendario di ufficio
      // - calendari dei sotto-uffici a cui appartengono
      // - i propri calendari privati
      // - calendari per cui hanno permessi espliciti
      [rows] = await db.execute(
        `
        SELECT c.*
        FROM calendars c
        LEFT JOIN calendar_permissions p ON p.calendar_id = c.id
        LEFT JOIN sub_office_calendars soc ON soc.calendar_id = c.id
        LEFT JOIN user_sub_offices us ON us.sub_office_id = soc.sub_office_id
        WHERE
          c.type = 'office'
          OR (c.type = 'sub-office' AND us.user_id = ?)
          OR (c.type = 'private' AND c.owner_user_id = ?)
          OR (p.user_id = ?)
        GROUP BY c.id
        `,
        [req.user.id, req.user.id, req.user.id]
      );
    }

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore server' });
  }
});

router.post('/', async (req, res) => {
  const { name, type, color } = req.body;
  if (!name || !type) {
    return res.status(400).json({ message: 'Nome e tipo richiesti' });
  }

  if (!['office', 'private', 'sub-office'].includes(type)) {
    return res.status(400).json({ message: 'Tipo calendario non valido' });
  }

  if (type === 'office' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Solo admin possono creare calendario ufficio' });
  }

  if (type === 'sub-office' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Solo admin possono creare calendari sotto-ufficio' });
  }

  try {
    const db = getDb();
    const ownerId = type === 'private' ? req.user.id : null;
    const [result] = await db.execute(
      'INSERT INTO calendars (name, type, owner_user_id, color) VALUES (?, ?, ?, ?)',
      [name, type, ownerId, color || null]
    );
    const [rows] = await db.execute('SELECT * FROM calendars WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore server' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, color } = req.body;

  try {
    const db = getDb();
    const [rows] = await db.execute('SELECT * FROM calendars WHERE id = ?', [id]);
    const calendar = rows[0];
    if (!calendar) {
      return res.status(404).json({ message: 'Calendario non trovato' });
    }

    if (calendar.type === 'office' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Solo admin possono modificare calendario ufficio' });
    }
    if (calendar.type === 'private' && calendar.owner_user_id !== req.user.id) {
      return res.status(403).json({ message: 'Non puoi modificare questo calendario privato' });
    }

    await db.execute(
      'UPDATE calendars SET name = ?, color = ? WHERE id = ?',
      [name || calendar.name, color || calendar.color, id]
    );
    const [updated] = await db.execute('SELECT * FROM calendars WHERE id = ?', [id]);
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
    await ensureSubOfficeCalendarsTable(db);

    const [rows] = await db.execute('SELECT * FROM calendars WHERE id = ?', [id]);
    const calendar = rows[0];
    if (!calendar) {
      return res.status(404).json({ message: 'Calendario non trovato' });
    }

    if (calendar.type === 'office' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Solo admin possono eliminare calendario ufficio' });
    }
    if (calendar.type === 'private' && calendar.owner_user_id !== req.user.id) {
      return res.status(403).json({ message: 'Non puoi eliminare questo calendario privato' });
    }

    // Se è un calendario di sotto-ufficio, blocco l'eliminazione
    // se il relativo sotto-ufficio ha utenti associati.
    if (calendar.type === 'sub-office') {
      const [rowsUsers] = await db.execute(
        `
        SELECT COUNT(us.user_id) AS users_count
        FROM sub_office_calendars soc
        JOIN user_sub_offices us ON us.sub_office_id = soc.sub_office_id
        WHERE soc.calendar_id = ?
        `,
        [id]
      );

      if (rowsUsers.length && rowsUsers[0].users_count > 0) {
        return res.status(400).json({
          message:
            'Impossibile eliminare calendario: ci sono utenti associati al sotto-ufficio collegato'
        });
      }
    }

    await db.execute('DELETE FROM calendars WHERE id = ?', [id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore server' });
  }
});

module.exports = router;

