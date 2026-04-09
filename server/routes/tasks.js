const router = require('express').Router();
const db = require('../db');

// PUT update task
router.put('/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const name = req.body.name !== undefined ? req.body.name : task.name;
  const description = req.body.description !== undefined ? req.body.description : task.description;
  const due_date = 'due_date' in req.body ? req.body.due_date : task.due_date;
  const priority = req.body.priority !== undefined ? req.body.priority : task.priority;
  const done = req.body.done !== undefined ? (req.body.done ? 1 : 0) : task.done;

  db.prepare(
    'UPDATE tasks SET name=?, description=?, due_date=?, priority=?, done=? WHERE id=?'
  ).run(name, description, due_date, priority, done, task.id);

  const updated = db.prepare(`
    SELECT t.*, u.username AS creator_username
    FROM tasks t JOIN users u ON u.id = t.created_by
    WHERE t.id = ?
  `).get(task.id);
  res.json(updated);
});

// DELETE task
router.delete('/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (req.user.role === 'viewer') {
    return res.status(403).json({ error: 'Viewers cannot delete tasks' });
  }
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(task.project_id);
  const canDelete = req.user.role === 'owner'
    || task.created_by === req.user.id
    || (project && project.owner_id === req.user.id);
  if (!canDelete) return res.status(403).json({ error: 'Forbidden' });
  db.prepare('DELETE FROM tasks WHERE id = ?').run(task.id);
  res.json({ ok: true });
});

// POST create subtask
router.post('/:taskId/subtasks', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const r = db.prepare('INSERT INTO subtasks (task_id, name) VALUES (?, ?)').run(req.params.taskId, name);
  res.json(db.prepare('SELECT * FROM subtasks WHERE id = ?').get(r.lastInsertRowid));
});

// --- Task Timer ---
router.post('/:id/timer/start', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Not found' });
  if (task.timer_started_at) return res.json({ timer_started_at: task.timer_started_at });
  db.prepare("UPDATE tasks SET timer_started_at = CAST(strftime('%s','now') AS INTEGER) WHERE id = ?").run(task.id);
  const updated = db.prepare('SELECT timer_started_at FROM tasks WHERE id = ?').get(task.id);
  res.json({ timer_started_at: updated.timer_started_at });
});

router.post('/:id/timer/stop', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Not found' });
  if (!task.timer_started_at) return res.json({ elapsed_seconds: task.elapsed_seconds });
  db.prepare(`
    UPDATE tasks
    SET elapsed_seconds = elapsed_seconds + (CAST(strftime('%s','now') AS INTEGER) - timer_started_at),
        timer_started_at = NULL
    WHERE id = ?
  `).run(task.id);
  const updated = db.prepare('SELECT elapsed_seconds FROM tasks WHERE id = ?').get(task.id);
  res.json({ elapsed_seconds: updated.elapsed_seconds });
});

router.patch('/:id/timer/sync', (req, res) => {
  const { elapsed_seconds } = req.body;
  if (elapsed_seconds === undefined) return res.status(400).json({ error: 'elapsed_seconds required' });
  db.prepare(`
    UPDATE tasks
    SET elapsed_seconds = ?, timer_started_at = CAST(strftime('%s','now') AS INTEGER)
    WHERE id = ?
  `).run(Math.floor(elapsed_seconds), req.params.id);
  const updated = db.prepare('SELECT elapsed_seconds, timer_started_at FROM tasks WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// --- Comments ---
router.get('/:id/comments', (req, res) => {
  const comments = db.prepare(`
    SELECT c.*, u.username
    FROM comments c JOIN users u ON u.id = c.user_id
    WHERE c.task_id = ?
    ORDER BY c.created_at ASC
  `).all(req.params.id);
  res.json(comments);
});

router.post('/:id/comments', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text required' });
  const r = db.prepare('INSERT INTO comments (task_id, user_id, text) VALUES (?, ?, ?)').run(req.params.id, req.user.id, text);
  const comment = db.prepare(`
    SELECT c.*, u.username
    FROM comments c JOIN users u ON u.id = c.user_id
    WHERE c.id = ?
  `).get(r.lastInsertRowid);
  res.json(comment);
});

// --- Attachments ---
router.get('/:id/attachments', (req, res) => {
  const items = db.prepare(`
    SELECT a.*, u.username AS attacher_username
    FROM attachments a JOIN users u ON u.id = a.attached_by
    WHERE a.task_id = ?
    ORDER BY a.attached_at ASC
  `).all(req.params.id);
  res.json(items);
});

router.post('/:id/attachments', (req, res) => {
  const { name, url, drive_file_id = null, file_type = null } = req.body;
  if (!name || !url) return res.status(400).json({ error: 'name and url required' });
  const r = db.prepare(
    'INSERT INTO attachments (task_id, name, url, drive_file_id, file_type, attached_by) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.params.id, name, url, drive_file_id, file_type, req.user.id);
  const item = db.prepare(`
    SELECT a.*, u.username AS attacher_username
    FROM attachments a JOIN users u ON u.id = a.attached_by
    WHERE a.id = ?
  `).get(r.lastInsertRowid);
  res.json(item);
});

module.exports = router;
