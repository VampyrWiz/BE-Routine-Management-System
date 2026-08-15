// ProtectedRoute guards pages behind authentication and role checks.
// It prevents unauthorised users from accessing restricted routes.
// Navigate: renders a redirect in place of the page (react-router's component
// for programmatic <Redirect>); useAuth: provides teacher + loading state.
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { teacher, loading } = useAuth();

  // While auth state is being restored from localStorage, render nothing
  // to prevent a flash of the login redirect on refresh.
  if (loading) return null;

  // If not authenticated at all, redirect to login.
  if (!teacher) return <Navigate to="/login" replace />;

  // If authenticated but the user's role isn't in the allowed roles list,
  // redirect to dashboard (they can still use the app, just not this page).
  if (roles && !roles.includes(teacher.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Authorised — render the wrapped page content.
  return children;
}
