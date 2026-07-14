import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isInstructor, loading } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="logo">
          LearnFlow
        </Link>
        <div className="nav-links">
          <Link to="/courses">Courses</Link>
          {!loading && user && (
            <>
              {isInstructor ? (
                <Link to="/instructor">My Courses</Link>
              ) : (
                <Link to="/my-courses">My Learning</Link>
              )}
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{user.name}</span>
              <button type="button" className="btn btn-ghost" onClick={handleLogout}>
                Log out
              </button>
            </>
          )}
          {!loading && !user && (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/register" className="btn btn-primary">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
