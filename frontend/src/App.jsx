// Top-level route definitions for the entire application
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Teachers from './pages/Teachers/Teachers';
// Teacher Stats — per-teacher weekly load: hours, class count, theory vs
// practical split, and free hours against the weekly max.
import TeacherStats from './pages/TeacherStats/TeacherStats';
import Subjects from './pages/Subjects/Subjects';
import Programs from './pages/Programs/Programs';
import Departments from './pages/Departments/Departments';
import Routines from './pages/Routines/Routines';
import TeacherSchedule from './pages/TeacherSchedule/TeacherSchedule';
// Section Schedule — read-only weekly timetable grouped per section, built
// from the same routine entries the teacher schedule manages.
import SectionSchedule from './pages/SectionSchedule/SectionSchedule';
// Room Schedule — weekly timetable per room, visible to every role.
import RoomSchedule from './pages/RoomSchedule/RoomSchedule';
import Approvals from './pages/Approvals/Approvals';
// Profile page — allows any authenticated user to edit their own account
// details (name, email, contact, designation) and change their password.
import Profile from './pages/Profile/Profile';

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
      {/* Teacher Stats — weekly load overview, same audience as Teachers */}
      <Route path="/teacher-stats" element={<AppLayout roles={['hod', 'dhod']}><TeacherStats /></AppLayout>} />
      <Route path="/subjects" element={<AppLayout roles={['hod', 'dhod', 'teacher']}><Subjects /></AppLayout>} />
      <Route path="/programs" element={<AppLayout roles={['hod', 'dhod', 'teacher']}><Programs /></AppLayout>} />
      <Route path="/departments" element={<AppLayout roles={['hod', 'dhod', 'teacher']}><Departments /></AppLayout>} />
      <Route path="/routines" element={<AppLayout roles={['hod', 'dhod']}><Routines /></AppLayout>} />
      {/* Teacher Schedule — own weekly timetable view, available to every role */}
      <Route path="/teacher-schedule" element={<AppLayout roles={['hod', 'dhod', 'teacher']}><TeacherSchedule /></AppLayout>} />
      {/* Section Schedule is a read-only weekly timetable grouped per section,
          visible to every role including guests (guests land here after
          "Sign in as guest"; its data comes from the public /routines/public
          endpoint so no token is needed). */}
      <Route path="/section-schedule" element={<AppLayout roles={['hod', 'dhod', 'teacher', 'guest']}><SectionSchedule /></AppLayout>} />
      {/* Room Schedule — read-only weekly timetable per room, like the section
          schedule: visible to every role including guests (data comes from
          the public endpoint). */}
      <Route path="/room-schedule" element={<AppLayout roles={['hod', 'dhod', 'teacher', 'guest']}><RoomSchedule /></AppLayout>} />
      <Route path="/approvals" element={<AppLayout roles={['hod', 'dhod', 'teacher']}><Approvals /></AppLayout>} />
      {/* Profile is accessible to all authenticated roles — every teacher
          should be able to update their own contact info and password. */}
      <Route path="/profile" element={<AppLayout roles={['hod', 'dhod', 'teacher']}><Profile /></AppLayout>} />
      {/* Catch-all: unknown routes go to the user's home — the section
          schedule for guests (their only page), the dashboard for everyone else. */}
      <Route path="*" element={<Navigate to={teacher?.role === 'guest' ? '/section-schedule' : '/dashboard'} replace />} />
    </Routes>
  );
}
