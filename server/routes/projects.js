const router = require('express').Router();
const db = require('../db');

// GET all projects with task count
router.get('/', (req, res) => {
  const projects = db.prepare(`
    SELECT p.*, COUNT(t.id) AS task_count
    FROM projects p
    LEFT JOIN tasks t ON t.project_id = p.id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `).all();
  res.json(projects);
});

// POST create project
router.post('/', (req, res) => {
  const { name, color = '#6366f1' } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const r = db.prepare(
    'INSERT INTO projects (name, color, owner_id) VALUES (?, ?, ?)'
  ).run(name, color, req.user.id);
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(r.lastInsertRowid);
  res.json(project);
});

// PUT update project (owner only)
router.put('/:id', (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  if (project.owner_id !== req.user.id && req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { name = project.name, color = project.color } = req.body;
  db.prepare('UPDATE projects SET name = ?, color = ? WHERE id = ?').run(name, color, project.id);
  const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(project.id);
  res.json(updated);
});

// DELETE project (owner only)
router.delete('/:id', (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  if (project.owner_id !== req.user.id && req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (req.user.role === 'viewer') {
    return res.status(403).json({ error: 'Viewers cannot delete projects' });
  }
  db.prepare('DELETE FROM projects WHERE id = ?').run(project.id);
  res.json({ ok: true });
});

// GET tasks for a project (with subtasks)
router.get('/:id/tasks', (req, res) => {
  const tasks = db.prepare(`
    SELECT t.*, u.username AS creator_username
    FROM tasks t
    JOIN users u ON u.id = t.created_by
    WHERE t.project_id = ?
    ORDER BY t.created_at DESC
  `).all(req.params.id);

  const subtasks = db.prepare(`
    SELECT s.*
    FROM subtasks s
    JOIN tasks t ON t.id = s.task_id
    WHERE t.project_id = ?
    ORDER BY s.created_at ASC
  `).all(req.params.id);

  const subtaskMap = {};
  for (const s of subtasks) {
    if (!subtaskMap[s.task_id]) subtaskMap[s.task_id] = [];
    subtaskMap[s.task_id].push(s);
  }

  res.json(tasks.map(t => ({ ...t, subtasks: subtaskMap[t.id] || [] })));
});

// POST create task in project
router.post('/:id/tasks', (req, res) => {
  const { name, description = '', due_date = null, priority = 'none' } = req.body;
  if (!name) return res.status(400).json({ error: 'Task name required' });
  const r = db.prepare(
    'INSERT INTO tasks (project_id, name, description, due_date, priority, created_by) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.params.id, name, description, due_date, priority, req.user.id);
  const task = db.prepare(`
    SELECT t.*, u.username AS creator_username
    FROM tasks t JOIN users u ON u.id = t.created_by
    WHERE t.id = ?
  `).get(r.lastInsertRowid);
  res.json({ ...task, subtasks: [] });
});

module.exports = router;
