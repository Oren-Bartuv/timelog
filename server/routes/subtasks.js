const router = require('express').Router();
const db = require('../db');

// PUT update subtask
router.put('/:id', (req, res) => {
  const s = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(req.params.id);
  if (!s) return res.status(404).json({ error: 'Not found' });
  const name = req.body.name !== undefined ? req.body.name : s.name;
  const done = req.body.done !== undefined ? (req.body.done ? 1 : 0) : s.done;
  db.prepare('UPDATE subtasks SET name = ?, done = ? WHERE id = ?').run(name, done, s.id);
  res.json(db.prepare('SELECT * FROM subtasks WHERE id = ?').get(s.id));
});

// DELETE subtask
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM subtasks WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Timer start
router.post('/:id/timer/start', (req, res) => {
  const s = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(req.params.id);
  if (!s) return res.status(404).json({ error: 'Not found' });
  if (s.timer_started_at) return res.json({ timer_started_at: s.timer_started_at });
  db.prepare("UPDATE subtasks SET timer_started_at = CAST(strftime('%s','now') AS INTEGER) WHERE id = ?").run(s.id);
  const updated = db.prepare('SELECT timer_started_at FROM subtasks WHERE id = ?').get(s.id);
  res.json({ timer_started_at: updated.timer_started_at });
});

// Timer stop
router.post('/:id/timer/stop', (req, res) => {
  const s = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(req.params.id);
  if (!s) return res.status(404).json({ error: 'Not found' });
  if (!s.timer_started_at) return res.json({ elapsed_seconds: s.elapsed_seconds });
  db.prepare(`
    UPDATE subtasks
    SET elapsed_seconds = elapsed_seconds + (CAST(strftime('%s','now') AS INTEGER) - timer_started_at),
        timer_started_at = NULL
    WHERE id = ?
  `).run(s.id);
  const updated = db.prepare('SELECT elapsed_seconds FROM subtasks WHERE id = ?').get(s.id);
  res.json({ elapsed_seconds: updated.elapsed_seconds });
});

// Timer sync
router.patch('/:id/timer/sync', (req, res) => {
  const { elapsed_seconds } = req.body;
  if (elapsed_seconds === undefined) return res.status(400).json({ error: 'elapsed_seconds required' });
  db.prepare(`
    UPDATE subtasks
    SET elapsed_seconds = ?, timer_started_at = CAST(strftime('%s','now') AS INTEGER)
    WHERE id = ?
  `).run(Math.floor(elapsed_seconds), req.params.id);
  const updated = db.prepare('SELECT elapsed_seconds, timer_started_at FROM subtasks WHERE id = ?').get(req.params.id);
  res.json(updated);
});

module.exports = router;
