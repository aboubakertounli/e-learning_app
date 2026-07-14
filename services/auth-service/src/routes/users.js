import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/:id', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
    [req.params.id]
  );

  if (!rows[0]) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = rows[0];
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.created_at,
    },
  });
});

export default router;
