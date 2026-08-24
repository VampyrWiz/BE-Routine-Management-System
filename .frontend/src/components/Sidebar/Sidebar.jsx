// Sidebar renders the navigation menu filtered by the current user's role.
// useAuth: reads teacher.role to decide which nav items are visible.
import { useAuth } from '../../context/AuthContext';

// Each nav item defines a route path, display label, icon, and the
// roles allowed to see it. Teachers cannot see the "Teachers" management page, etc.
const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['hod', 'dhod', 'teacher'] },
  { path: '/teachers', label: 'Teachers', icon: '👥', roles: ['hod', 'dhod'] },
  { path: '/subjects', label: 'Subjects', icon: '📚', roles: ['hod', 'dhod', 'teacher'] },
  { path: '/programs', label: 'Programs', icon: '🎓', roles: ['hod', 'dhod', 'teacher'] },
  { path: '/departments', label: 'Departments', icon: '🏛️', roles: ['hod', 'dhod', 'teacher'] },
  { path: '/routines', label: 'Edit Routine', icon: '📝', roles: ['hod', 'dhod'] },
  // Teacher Schedule — own weekly timetable for every role
  { path: '/teacher-schedule', label: 'Teacher Schedule', icon: '📅', roles: ['hod', 'dhod', 'teacher'] },
  // Section Schedule — read-only weekly timetable, visible to every role
  // including guests (guests see this page only).
  { path: '/section-schedule', label: 'Section Schedule', icon: '🗓️', roles: ['hod', 'dhod', 'teacher', 'guest'] },
  { path: '/approvals', label: 'Approvals', icon: '✅', roles: ['hod', 'dhod', 'teacher'] },
  // Profile is available to every role so teachers can update their own
  // contact info and password without involving the HoD.
  { path: '/profile', label: 'Profile', icon: '👤', roles: ['hod', 'dhod', 'teacher'] },
];

export default function Sidebar({ activePath, onNavigate }) {
  const { teacher } = useAuth();
  // Only show items whose roles array includes the current teacher's role
  const visibleItems = navItems.filter(item => item.roles.includes(teacher?.role));

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>BE Routine</h2>
        <span>Management System</span>
      </div>
      <nav className="sidebar-nav">
        {visibleItems.map(item => (
          // Buttons are used instead of <Link> because navigation is handled
          // via the onNavigate callback passed from Layout (using navigate()).
          // This keeps Sidebar as a presentational component.
          <button
            key={item.path}
            className={`nav-item ${activePath === item.path ? 'active' : ''}`}
            onClick={() => onNavigate(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
