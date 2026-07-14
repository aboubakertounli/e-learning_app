import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function publicUser(row) {
  return { id: row.id, email: row.email, name: row.name, role: row.role, createdAt: row.created_at };
}

router.post('/register', async (req, res) => {
  const { email, password, name, role } = req.body;

  if (!email?.trim() || !password || !name?.trim()) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const userRole = role === 'instructor' ? 'instructor' : 'student';

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role, created_at`,
      [email.trim().toLowerCase(), passwordHash, name.trim(), userRole]
    );

    const user = rows[0];
    res.status(201).json({ user: publicUser(user), token: signToken(user) });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    throw err;
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { rows } = await pool.query(
    'SELECT id, email, name, role, password_hash, created_at FROM users WHERE email = $1',
    [email.trim().toLowerCase()]
  );

  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  res.json({ user: publicUser(user), token: signToken(user) });
});

router.get('/me', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
    [req.user.sub]
  );

  if (!rows[0]) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user: publicUser(rows[0]) });
});

export default router;
