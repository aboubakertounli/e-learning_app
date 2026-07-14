import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import coursesRouter from './routes/courses.js';
import enrollmentsRouter from './routes/enrollments.js';
import { pool, runMigrations, closePool } from './db.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', service: 'learning' });
  } catch {
    res.status(503).json({ status: 'database unavailable', service: 'learning' });
  }
});

app.use('/api/courses', coursesRouter);
app.use('/api', enrollmentsRouter);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});

let server;

async function start() {
  if (process.env.DB_AUTO_MIGRATE !== 'false') {
    await runMigrations();
  }

  server = app.listen(port, () => {
    console.log(`Learning service running on port ${port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start learning service:', err);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  server?.close(async () => {
    await closePool();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 30000);
});
