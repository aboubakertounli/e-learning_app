import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { learningApi } from '../api';
import { useAuth } from '../context/AuthContext';

export default function CourseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  async function loadCourse() {
    const { course: data } = await learningApi.getCourse(id);
    setCourse(data);
    if (data.lessons.length && !activeLesson) {
      setActiveLesson(data.lessons[0]);
    }
  }

  useEffect(() => {
    learningApi
      .getCourse(id)
      .then(({ course: data }) => {
        setCourse(data);
        if (data.lessons.length) setActiveLesson(data.lessons[0]);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleEnroll() {
    setActionLoading(true);
    try {
      await learningApi.enroll(id);
      await loadCourse();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleComplete(lessonId) {
    setActionLoading(true);
    try {
      await learningApi.completeLesson(lessonId);
      await loadCourse();
      const updated = (await learningApi.getCourse(id)).course;
      const lesson = updated.lessons.find((l) => l.id === lessonId);
      setActiveLesson(lesson);
      setCourse(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading">Loading course…</div>
      </>
    );
  }

  if (error && !course) {
    return (
      <>
        <Navbar />
        <div className="empty-state">{error}</div>
      </>
    );
  }

  const canEnroll = user?.role === 'student' && !course.enrolled;

  return (
    <>
      <Navbar />
      <div className="course-detail-header">
        <div className="container">
          <p style={{ opacity: 0.85, marginBottom: '0.5rem' }}>By {course.instructorName}</p>
          <h1>{course.title}</h1>
          <p style={{ opacity: 0.9, maxWidth: '640px' }}>{course.description}</p>
          {course.enrolled && (
            <div style={{ marginTop: '1.25rem' }}>
              <div className="progress-bar" style={{ maxWidth: '300px', background: 'rgba(255,255,255,0.3)' }}>
                <div className="progress-fill" style={{ width: `${course.progress}%`, background: 'white' }} />
              </div>
              <small style={{ opacity: 0.9 }}>{course.progress}% complete</small>
            </div>
          )}
          {canEnroll && (
            <button type="button" className="btn btn-accent" style={{ marginTop: '1.25rem' }} onClick={handleEnroll} disabled={actionLoading}>
              {actionLoading ? 'Enrolling…' : 'Enroll in this course'}
            </button>
          )}
        </div>
      </div>

      <div className="container course-detail">
        {error && <p className="form-error">{error}</p>}
        {course.lessons.length === 0 ? (
          <div className="empty-state">No lessons yet. Check back soon!</div>
        ) : (
          <>
            <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '1rem' }}>Lessons</h2>
            <div className="lesson-list">
              {course.lessons.map((lesson) => (
                <button
                  key={lesson.id}
                  type="button"
                  className={`lesson-item ${activeLesson?.id === lesson.id ? 'active' : ''} ${lesson.completed ? 'completed' : ''}`}
                  onClick={() => setActiveLesson(lesson)}
                >
                  <span>{lesson.title}</span>
                  {lesson.completed && <span className="badge badge-enrolled">Done</span>}
                </button>
              ))}
            </div>
            {activeLesson && (
              <div className="card lesson-content-panel">
                <h2>{activeLesson.title}</h2>
                <p>{activeLesson.content}</p>
                {course.enrolled && !activeLesson.completed && user?.role === 'student' && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ marginTop: '1.5rem' }}
                    onClick={() => handleComplete(activeLesson.id)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Saving…' : 'Mark as complete'}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
