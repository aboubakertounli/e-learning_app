import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Catalog from './pages/Catalog';
import CourseDetail from './pages/CourseDetail';
import MyCourses from './pages/MyCourses';
import InstructorDashboard from './pages/InstructorDashboard';
import CreateCourse from './pages/CreateCourse';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/courses" element={<Catalog />} />
      <Route path="/courses/:id" element={<CourseDetail />} />
      <Route
        path="/my-courses"
        element={
          <ProtectedRoute role="student">
            <MyCourses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor"
        element={
          <ProtectedRoute role="instructor">
            <InstructorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor/new"
        element={
          <ProtectedRoute role="instructor">
            <CreateCourse />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
