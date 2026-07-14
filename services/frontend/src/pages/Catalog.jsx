import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import CourseCard from '../components/CourseCard';
import { learningApi } from '../api';

export default function Catalog() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    learningApi
      .listCourses()
      .then(({ courses }) => setCourses(courses))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar />
      <div className="container">
        <header className="page-header">
          <h1>Course catalog</h1>
          <p>Explore courses and start learning today</p>
        </header>
        {loading && <div className="loading">Loading courses…</div>}
        {error && <p className="form-error" style={{ textAlign: 'center' }}>{error}</p>}
        {!loading && !error && courses.length === 0 && (
          <div className="empty-state">
            <p>No courses yet. Instructors can create the first one!</p>
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
