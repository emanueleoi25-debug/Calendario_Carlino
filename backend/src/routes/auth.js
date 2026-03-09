const express = require('express');
const { getDb } = require('../utils/db');
const { generateToken, authMiddleware } = require('../utils/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username e password richiesti' });
  }

  try {
    const db = getDb();
    const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ message: 'Credenziali non valide' });
    }

    if (password !== user.password_hash) {
      return res.status(401).json({ message: 'Credenziali non valide' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore server' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const [rows] = await db.execute(
      'SELECT id, username, email, role FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows[0]) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Errore server' });
  }
});

module.exports = router;

