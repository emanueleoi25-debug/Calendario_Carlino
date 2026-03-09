const express = require('express');
const { getDb } = require('../utils/db');
const { authMiddleware, requireAdmin } = require('../utils/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const [rows] = await db.execute(
      `
      SELECT c.*
      FROM calendars c
      LEFT JOIN calendar_permissions p ON p.calendar_id = c.id
      WHERE
        c.type = 'office'
        OR c.type = 'sub-office'
        OR (c.type = 'private' AND c.owner_user_id = ?)
        OR (p.user_id = ?)
      GROUP BY c.id
      `,
      [req.user.id, req.user.id]
    );
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

    await db.execute('DELETE FROM calendars WHERE id = ?', [id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore server' });
  }
});

router.use('/sub-offices', requireAdmin);

module.exports = router;

