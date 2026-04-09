const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { SECRET, requireAuth } = require('../middleware/auth');

router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  const validRole = ['owner', 'viewer'].includes(role) ? role : 'owner';
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = db.prepare(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)'
    ).run(username, hash, validRole);
    const user = { id: result.lastInsertRowid, username, role: validRole };
    const token = jwt.sign(user, SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (e) {
    if (e.message && e.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Username already taken' });
    }
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const payload = { id: user.id, username: user.username, role: user.role };
  const token = jwt.sign(payload, SECRET, { expiresIn: '7d' });
  res.json({ token, user: payload });
});

router.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});

module.exports = router;
