const router = require('express').Router();
const db = require('../db');

// DELETE an attachment
router.delete('/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM attachments WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM attachments WHERE id = ?').run(item.id);
  res.json({ ok: true });
});

module.exports = router;
