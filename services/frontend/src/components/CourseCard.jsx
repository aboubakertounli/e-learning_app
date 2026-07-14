import { Link } from 'react-router-dom';

export default function CourseCard({ course }) {
  return (
    <Link to={`/courses/${course.id}`} className="card course-card">
      <div className="course-card-header">
        <h3>{course.title}</h3>
      </div>
      <div className="card-body">
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '0.75rem' }}>
          {course.description.length > 120 ? `${course.description.slice(0, 120)}…` : course.description}
        </p>
        <div className="course-card-meta">
          <span>By {course.instructorName}</span>
          <span>{course.lessonCount} lessons</span>
          <span>{course.studentCount} students</span>
        </div>
        {course.enrolled && <span className="badge badge-enrolled" style={{ marginTop: '0.75rem' }}>Enrolled</span>}
        {course.progress !== undefined && (
          <>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${course.progress}%` }} />
            </div>
            <small style={{ color: 'var(--text-muted)' }}>{course.progress}% complete</small>
          </>
        )}
      </div>
    </Link>
  );
}
