// Axios instance pre-configured with the API base path so all requests
// go through the same proxy base without repeating the URL in every call.
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Request interceptor: automatically attaches the JWT token from localStorage
// to every outgoing request's Authorization header. This avoids manually
// adding the header in each API call.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: catches 401 Unauthorized responses globally.
// When the token expires or is invalid, we clear stored auth data and
// redirect to the login page so the user can re-authenticate.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('teacher');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
