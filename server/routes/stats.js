const router = require('express').Router();
const db = require('../db');

// GET total tracked time across all tasks and subtasks
router.get('/total-time', (req, res) => {
  const taskRow = db.prepare(`
    SELECT SUM(
      elapsed_seconds + CASE
        WHEN timer_started_at IS NOT NULL
        THEN (CAST(strftime('%s','now') AS INTEGER) - timer_started_at)
        ELSE 0
      END
    ) AS total
    FROM tasks
  `).get();

  const subtaskRow = db.prepare(`
    SELECT SUM(
      elapsed_seconds + CASE
        WHEN timer_started_at IS NOT NULL
        THEN (CAST(strftime('%s','now') AS INTEGER) - timer_started_at)
        ELSE 0
      END
    ) AS total
    FROM subtasks
  `).get();

  const total_seconds = (taskRow.total || 0) + (subtaskRow.total || 0);
  res.json({ total_seconds });
});

module.exports = router;
