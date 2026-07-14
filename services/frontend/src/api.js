const AUTH_BASE = import.meta.env.VITE_AUTH_API_URL || '';
const LEARNING_BASE = import.meta.env.VITE_LEARNING_API_URL || '';

function getToken() {
  return localStorage.getItem('token');
}

async function request(base, path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${base}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export const authApi = {
  register: (body) => request(AUTH_BASE, '/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request(AUTH_BASE, '/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request(AUTH_BASE, '/api/auth/me'),
};

export const learningApi = {
  listCourses: () => request(LEARNING_BASE, '/api/courses'),
  getCourse: (id) => request(LEARNING_BASE, `/api/courses/${id}`),
  myCourses: () => request(LEARNING_BASE, '/api/my-courses'),
  instructorCourses: () => request(LEARNING_BASE, '/api/courses/mine'),
  createCourse: (body) => request(LEARNING_BASE, '/api/courses', { method: 'POST', body: JSON.stringify(body) }),
  addLesson: (courseId, body) =>
    request(LEARNING_BASE, `/api/courses/${courseId}/lessons`, { method: 'POST', body: JSON.stringify(body) }),
  enroll: (courseId) =>
    request(LEARNING_BASE, `/api/courses/${courseId}/enroll`, { method: 'POST', body: '{}' }),
  completeLesson: (lessonId) =>
    request(LEARNING_BASE, `/api/lessons/${lessonId}/complete`, { method: 'POST', body: '{}' }),
};
