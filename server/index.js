const express = require('express');
const cors = require('cors');
const { requireAuth } = require('./middleware/auth');

const authRouter        = require('./routes/auth');
const projectsRouter    = require('./routes/projects');
const tasksRouter       = require('./routes/tasks');
const subtasksRouter    = require('./routes/subtasks');
const attachmentsRouter = require('./routes/attachments');
const statsRouter       = require('./routes/stats');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Public
app.use('/api/auth', authRouter);

// Protected — apply requireAuth before all other routes
app.use('/api', requireAuth);
app.use('/api/projects',    projectsRouter);
app.use('/api/tasks',       tasksRouter);
app.use('/api/subtasks',    subtasksRouter);
app.use('/api/attachments', attachmentsRouter);
app.use('/api/stats',       statsRouter);

const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
