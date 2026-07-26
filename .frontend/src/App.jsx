// Top-level route definitions for the entire application
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Teachers from './pages/Teachers/Teachers';
import Subjects from './pages/Subjects/Subjects';
import Programs from './pages/Programs/Programs';
import Departments from './pages/Departments/Departments';
import Routines from './pages/Routines/Routines';
import Approvals from './pages/Approvals/Approvals';

// AppLayout wraps every authenticated page: ProtectedRoute checks auth + role first,
// then Layout renders the sidebar + topbar shell around the page's children.
function AppLayout({ children, roles }) {
  return (
    <ProtectedRoute roles={roles}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  const { teacher } = useAuth();

  return (
    <Routes>
      {/* Login redirects to dashboard if already authenticated */}
      <Route path="/login" element={teacher ? <Navigate to="/dashboard" replace /> : <Login />} />
      {/* Each protected route restricts access by role array — only matching roles can view the page */}
      <Route path="/dashboard" element={<AppLayout roles={['hod', 'dhod', 'teacher']}><Dashboard /></AppLayout>} />
      <Route path="/teachers" element={<AppLayout roles={['hod', 'dhod']}><Teachers /></AppLayout>} />
      <Route path="/subjects" element={<AppLayout roles={['hod', 'dhod', 'teacher']}><Subjects /></AppLayout>} />
      <Route path="/programs" element={<AppLayout roles={['hod', 'dhod', 'teacher']}><Programs /></AppLayout>} />
      <Route path="/departments" element={<AppLayout roles={['hod', 'dhod', 'teacher']}><Departments /></AppLayout>} />
      <Route path="/routines" element={<AppLayout roles={['hod', 'dhod', 'teacher']}><Routines /></AppLayout>} />
      <Route path="/approvals" element={<AppLayout roles={['hod', 'dhod', 'teacher']}><Approvals /></AppLayout>} />
      {/* Catch-all: any unknown route redirects to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
