// AuthProvider manages the authenticated teacher's state globally.
// It persists the token and teacher profile to localStorage so the
// session survives page refreshes, and rehydrates state on mount.
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, check if a token + teacher profile exist in localStorage.
  // If they do, restore teacher state so the user stays logged in across refreshes.
  useEffect(() => {
    const token = localStorage.getItem('token');
    const saved = localStorage.getItem('teacher');
    if (token && saved) {
      setTeacher(JSON.parse(saved));
    }
    setLoading(false);
  }, []);

  // Login sends credentials to the backend, saves the returned JWT and
  // teacher object to both localStorage (persistence) and React state (UI reactivity).
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('teacher', JSON.stringify(data.teacher));
    setTeacher(data.teacher);
    return data;
  };

  // Logout clears stored auth data from both localStorage and state.
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('teacher');
    setTeacher(null);
  };

  return (
    <AuthContext.Provider value={{ teacher, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for consuming auth context — components call useAuth()
// to access teacher state, login, and logout without importing useContext directly.
export const useAuth = () => useContext(AuthContext);
