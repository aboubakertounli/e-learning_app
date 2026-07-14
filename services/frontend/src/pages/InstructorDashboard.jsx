import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CourseCard from '../components/CourseCard';
import { learningApi } from '../api';

export default function InstructorDashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    learningApi
      .instructorCourses()
      .then(({ courses }) => setCourses(courses))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar />
      <div className="container">
        <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1>My courses</h1>
            <p>Manage the courses you teach</p>
          </div>
          <Link to="/instructor/new" className="btn btn-primary">
            + Create course
          </Link>
        </header>
        {loading && <div className="loading">Loading…</div>}
        {error && <p className="form-error" style={{ textAlign: 'center' }}>{error}</p>}
        {!loading && !error && courses.length === 0 && (
          <div className="empty-state">
            <p>You haven&apos;t created any courses yet.</p>
            <Link to="/instructor/new" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Create your first course
            </Link>
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
