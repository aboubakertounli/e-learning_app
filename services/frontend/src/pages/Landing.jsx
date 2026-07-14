import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Landing() {
  return (
    <>
      <Navbar />
      <section className="hero container">
        <h1>Learn at your own pace</h1>
        <p>
          Discover courses from expert instructors, track your progress, and build skills with a platform
          designed for modern learners.
        </p>
        <div className="hero-actions">
          <Link to="/courses" className="btn btn-primary">
            Browse courses
          </Link>
          <Link to="/register" className="btn btn-outline">
            Create account
          </Link>
        </div>
      </section>
      <section className="container" style={{ paddingBottom: '4rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          {[
            { title: 'Expert instructors', desc: 'Courses created by professionals who know their craft.' },
            { title: 'Track progress', desc: 'Complete lessons and watch your progress grow in real time.' },
            { title: 'Learn anywhere', desc: 'Access your courses from any device, anytime.' },
          ].map((item) => (
            <div key={item.title} className="card card-body">
              <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '0.5rem' }}>{item.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
