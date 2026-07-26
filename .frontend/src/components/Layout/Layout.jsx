// Layout composes the fixed Sidebar + sticky Topbar + scrollable main content area
// into the shell that wraps every authenticated page.
import Sidebar from '../Sidebar/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Layout({ children }) {
  const { teacher, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract the top-level path segment (e.g. "/dashboard" from "/dashboard/something")
  // so we can highlight the active nav item.
  const activePath = '/' + location.pathname.split('/')[1];

  const handleNavigate = (path) => {
    navigate(path);
  };

  // Maps each role to its corresponding CSS badge class for colour-coding
  const roleBadge = {
    hod: 'badge-hod',
    dhod: 'badge-dhod',
    teacher: 'badge-teacher',
  };

  return (
    <div className="app-layout">
      <Sidebar activePath={activePath} onNavigate={handleNavigate} />
      <div className="main-area">
        <header className="topbar">
          <div className="topbar-title">BE Routine Manager</div>
          <div className="topbar-right">
            <div className="teacher-info">
              {/* Display the teacher's name and a colour-coded role badge with department code */}
              <div className="teacher-name">{teacher?.name}</div>
              <div className="teacher-role">
                <span className={`badge ${roleBadge[teacher?.role]}`}>{teacher?.role?.toUpperCase()}</span>
                {' '}{teacher?.department_code}
              </div>
            </div>
            {/* Theme toggle button switches between dark (sun icon) and light (moon icon) */}
            <button className="theme-btn" onClick={toggle} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button className="logout-btn" onClick={logout}>Logout</button>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
