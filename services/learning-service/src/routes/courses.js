import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';

const router = Router();

async function getCourseWithLessons(courseId, userId) {
  const { rows: courses } = await pool.query(
    `SELECT id, title, description, instructor_id, instructor_name, created_at
     FROM courses WHERE id = $1`,
    [courseId]
  );

  if (!courses[0]) return null;

  const { rows: lessons } = await pool.query(
    `SELECT id, title, content, order_index, created_at
     FROM lessons WHERE course_id = $1 ORDER BY order_index, created_at`,
    [courseId]
  );

  let enrollment = null;
  let completedLessonIds = [];

  if (userId) {
    const { rows: enrollments } = await pool.query(
      'SELECT id, enrolled_at FROM enrollments WHERE course_id = $1 AND user_id = $2',
      [courseId, userId]
    );
    enrollment = enrollments[0] || null;

    if (enrollment) {
      const { rows: progress } = await pool.query(
        'SELECT lesson_id FROM lesson_progress WHERE enrollment_id = $1',
        [enrollment.id]
      );
      completedLessonIds = progress.map((p) => p.lesson_id);
    }
  }

  return {
    ...courses[0],
    lessons,
    enrolled: Boolean(enrollment),
    enrollmentId: enrollment?.id || null,
    completedLessonIds,
  };
}

router.get('/', optionalAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT c.id, c.title, c.description, c.instructor_id, c.instructor_name, c.created_at,
            COUNT(DISTINCT l.id)::int AS lesson_count,
            COUNT(DISTINCT e.id)::int AS student_count
     FROM courses c
     LEFT JOIN lessons l ON l.course_id = c.id
     LEFT JOIN enrollments e ON e.course_id = c.id
     GROUP BY c.id
     ORDER BY c.created_at DESC`
  );

  let enrolledCourseIds = new Set();
  if (req.user) {
    const { rows: enrolled } = await pool.query(
      'SELECT course_id FROM enrollments WHERE user_id = $1',
      [req.user.sub]
    );
    enrolledCourseIds = new Set(enrolled.map((e) => e.course_id));
  }

  res.json({
    courses: rows.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      instructorId: c.instructor_id,
      instructorName: c.instructor_name,
      lessonCount: c.lesson_count,
      studentCount: c.student_count,
      enrolled: enrolledCourseIds.has(c.id),
      createdAt: c.created_at,
    })),
  });
});

router.get('/mine', requireAuth, requireRole('instructor'), async (req, res) => {
  const { rows } = await pool.query(
    `SELECT c.id, c.title, c.description, c.instructor_id, c.instructor_name, c.created_at,
            COUNT(DISTINCT l.id)::int AS lesson_count,
            COUNT(DISTINCT e.id)::int AS student_count
     FROM courses c
     LEFT JOIN lessons l ON l.course_id = c.id
     LEFT JOIN enrollments e ON e.course_id = c.id
     WHERE c.instructor_id = $1
     GROUP BY c.id
     ORDER BY c.created_at DESC`,
    [req.user.sub]
  );

  res.json({
    courses: rows.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      instructorId: c.instructor_id,
      instructorName: c.instructor_name,
      lessonCount: c.lesson_count,
      studentCount: c.student_count,
      createdAt: c.created_at,
    })),
  });
});

router.get('/:id', optionalAuth, async (req, res) => {
  const course = await getCourseWithLessons(req.params.id, req.user?.sub);
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  res.json({
    course: {
      id: course.id,
      title: course.title,
      description: course.description,
      instructorId: course.instructor_id,
      instructorName: course.instructor_name,
      createdAt: course.created_at,
      enrolled: course.enrolled,
      enrollmentId: course.enrollmentId,
      lessons: course.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        content: l.content,
        orderIndex: l.order_index,
        completed: course.completedLessonIds.includes(l.id),
      })),
      progress: course.lessons.length
        ? Math.round((course.completedLessonIds.length / course.lessons.length) * 100)
        : 0,
    },
  });
});

router.post('/', requireAuth, requireRole('instructor'), async (req, res) => {
  const { title, description } = req.body;

  if (!title?.trim() || !description?.trim()) {
    return res.status(400).json({ error: 'Title and description are required' });
  }

  const { rows } = await pool.query(
    `INSERT INTO courses (title, description, instructor_id, instructor_name)
     VALUES ($1, $2, $3, $4)
     RETURNING id, title, description, instructor_id, instructor_name, created_at`,
    [title.trim(), description.trim(), req.user.sub, req.user.name]
  );

  const course = rows[0];
  res.status(201).json({
    course: {
      id: course.id,
      title: course.title,
      description: course.description,
      instructorId: course.instructor_id,
      instructorName: course.instructor_name,
      lessonCount: 0,
      studentCount: 0,
      createdAt: course.created_at,
    },
  });
});

router.post('/:id/lessons', requireAuth, requireRole('instructor'), async (req, res) => {
  const { title, content, orderIndex } = req.body;

  if (!title?.trim() || !content?.trim()) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const { rows: courses } = await pool.query(
    'SELECT id, instructor_id FROM courses WHERE id = $1',
    [req.params.id]
  );

  const course = courses[0];
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  if (course.instructor_id !== req.user.sub) {
    return res.status(403).json({ error: 'You can only add lessons to your own courses' });
  }

  const { rows } = await pool.query(
    `INSERT INTO lessons (course_id, title, content, order_index)
     VALUES ($1, $2, $3, $4)
     RETURNING id, title, content, order_index, created_at`,
    [req.params.id, title.trim(), content.trim(), orderIndex ?? 0]
  );

  const lesson = rows[0];
  res.status(201).json({
    lesson: {
      id: lesson.id,
      title: lesson.title,
      content: lesson.content,
      orderIndex: lesson.order_index,
      createdAt: lesson.created_at,
    },
  });
});

export default router;
