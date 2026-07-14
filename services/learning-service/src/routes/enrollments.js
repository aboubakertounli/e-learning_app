import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/my-courses', requireAuth, requireRole('student'), async (req, res) => {
  const { rows } = await pool.query(
    `SELECT c.id, c.title, c.description, c.instructor_name, e.id AS enrollment_id, e.enrolled_at,
            COUNT(DISTINCT l.id)::int AS lesson_count,
            COUNT(DISTINCT lp.lesson_id)::int AS completed_count
     FROM enrollments e
     JOIN courses c ON c.id = e.course_id
     LEFT JOIN lessons l ON l.course_id = c.id
     LEFT JOIN lesson_progress lp ON lp.enrollment_id = e.id
     WHERE e.user_id = $1
     GROUP BY c.id, e.id
     ORDER BY e.enrolled_at DESC`,
    [req.user.sub]
  );

  res.json({
    courses: rows.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      instructorName: c.instructor_name,
      enrollmentId: c.enrollment_id,
      enrolledAt: c.enrolled_at,
      lessonCount: c.lesson_count,
      completedCount: c.completed_count,
      progress: c.lesson_count ? Math.round((c.completed_count / c.lesson_count) * 100) : 0,
    })),
  });
});

router.post('/courses/:courseId/enroll', requireAuth, requireRole('student'), async (req, res) => {
  const { rows: courses } = await pool.query('SELECT id FROM courses WHERE id = $1', [req.params.courseId]);
  if (!courses[0]) {
    return res.status(404).json({ error: 'Course not found' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO enrollments (course_id, user_id)
       VALUES ($1, $2)
       RETURNING id, course_id, user_id, enrolled_at`,
      [req.params.courseId, req.user.sub]
    );

    res.status(201).json({
      enrollment: {
        id: rows[0].id,
        courseId: rows[0].course_id,
        userId: rows[0].user_id,
        enrolledAt: rows[0].enrolled_at,
      },
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Already enrolled in this course' });
    }
    throw err;
  }
});

router.post('/lessons/:lessonId/complete', requireAuth, requireRole('student'), async (req, res) => {
  const { rows: lessons } = await pool.query(
    `SELECT l.id, l.course_id FROM lessons l WHERE l.id = $1`,
    [req.params.lessonId]
  );

  const lesson = lessons[0];
  if (!lesson) {
    return res.status(404).json({ error: 'Lesson not found' });
  }

  const { rows: enrollments } = await pool.query(
    'SELECT id FROM enrollments WHERE course_id = $1 AND user_id = $2',
    [lesson.course_id, req.user.sub]
  );

  const enrollment = enrollments[0];
  if (!enrollment) {
    return res.status(403).json({ error: 'You must enroll before completing lessons' });
  }

  await pool.query(
    `INSERT INTO lesson_progress (enrollment_id, lesson_id)
     VALUES ($1, $2)
     ON CONFLICT (enrollment_id, lesson_id) DO NOTHING`,
    [enrollment.id, lesson.id]
  );

  res.json({ success: true });
});

export default router;
