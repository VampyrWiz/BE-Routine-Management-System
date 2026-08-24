// Login page — the only public route. Collects email + password and calls the
// AuthContext login(), which hits POST /api/auth/login and stores the JWT.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  // Controlled form inputs: React state drives input values, onChange handlers update state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // error holds API error messages displayed as an alert banner
  const [error, setError] = useState('');
  // loading flag disables the submit button to prevent double-submit while request is in-flight
  const [loading, setLoading] = useState(false);
  const { login, loginAsGuest } = useAuth();
  const navigate = useNavigate();

  // Guests skip the backend entirely: a local { role: 'guest' } identity is
  // stored so ProtectedRoute lets them into the Section Schedule page only.
  const handleGuest = () => {
    loginAsGuest();
    navigate('/section-schedule');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');           // Clear previous error on each submission attempt
    setLoading(true);       // Lock the button to prevent duplicate submissions
    try {
      await login(email, password);
      navigate('/dashboard'); // Redirect to dashboard only on successful auth
    } catch (err) {
      // Extract server error message or fall back to generic text
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);    // Re-enable button regardless of outcome
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>BE Routine Manager</h1>
        <p>Sign in to your account</p>
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="form-group">
          <label>Email</label>
          <input
            className="form-control"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            className="form-control"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        <button className="btn btn-secondary" type="button" onClick={handleGuest}>
          Sign in as guest
        </button>
      </form>
    </div>
  );
}
