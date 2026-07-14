import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import CourseCard from '../components/CourseCard';
import { learningApi } from '../api';

export default function MyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    learningApi
      .myCourses()
      .then(({ courses }) => setCourses(courses))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar />
      <div className="container">
        <header className="page-header">
          <h1>My learning</h1>
          <p>Pick up where you left off</p>
        </header>
        {loading && <div className="loading">Loading…</div>}
        {error && <p className="form-error" style={{ textAlign: 'center' }}>{error}</p>}
        {!loading && !error && courses.length === 0 && (
          <div className="empty-state">
            <p>You haven&apos;t enrolled in any courses yet.</p>
            <a href="/courses" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Browse courses
            </a>
          </div>
        )}
        <div className="course-grid">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </>
  );
}
