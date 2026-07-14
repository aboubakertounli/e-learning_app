import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { learningApi } from '../api';

export default function CreateCourse() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [courseId, setCourseId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lessonsAdded, setLessonsAdded] = useState(0);

  async function handleCreateCourse(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { course } = await learningApi.createCourse({ title, description });
      setCourseId(course.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddLesson(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await learningApi.addLesson(courseId, {
        title: lessonTitle,
        content: lessonContent,
        orderIndex: lessonsAdded,
      });
      setLessonsAdded((n) => n + 1);
      setLessonTitle('');
      setLessonContent('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingBottom: '3rem', maxWidth: '640px' }}>
        <header className="page-header">
          <h1>Create a course</h1>
          <p>Share your knowledge with students</p>
        </header>

        {!courseId ? (
          <form onSubmit={handleCreateCourse} className="card card-body">
            <div className="form-group">
              <label htmlFor="title">Course title</label>
              <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea id="description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>
            {error && <p className="form-error">{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating…' : 'Create course'}
            </button>
          </form>
        ) : (
          <>
            <div className="card card-body" style={{ marginBottom: '1.5rem', background: '#e8f4f4' }}>
              <strong>Course created!</strong> Add lessons below, then publish by viewing the course.
            </div>
            <form onSubmit={handleAddLesson} className="card card-body">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', marginBottom: '1rem' }}>
                Add lesson {lessonsAdded + 1}
              </h2>
              <div className="form-group">
                <label htmlFor="lessonTitle">Lesson title</label>
                <input id="lessonTitle" value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label htmlFor="lessonContent">Lesson content</label>
                <textarea id="lessonContent" rows={6} value={lessonContent} onChange={(e) => setLessonContent(e.target.value)} required />
              </div>
              {error && <p className="form-error">{error}</p>}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Adding…' : 'Add lesson'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => navigate(`/courses/${courseId}`)}>
                  View course ({lessonsAdded} lessons)
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </>
  );
}
