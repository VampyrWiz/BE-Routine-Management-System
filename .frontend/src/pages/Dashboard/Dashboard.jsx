import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export default function Dashboard() {
  const { teacher } = useAuth();
  // stats holds aggregate counts displayed in the grid cards
  const [stats, setStats] = useState({ teachers: 0, courses: 0, routines: 0, pendingApprovals: 0 });
  // recentRoutines holds the last 5 routine entries for the summary table
  const [recentRoutines, setRecentRoutines] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Parallel data fetching with Promise.all — all three requests fire simultaneously
        // This is faster than sequential awaits since the endpoints are independent
        const [teachersRes, coursesRes, routinesRes] = await Promise.all([
          api.get('/teachers').catch(() => ({ data: [] })),
          api.get('/subjects', { params: { program: '' } }),
          api.get('/routines'),
        ]);
        setStats({
          teachers: teachersRes.data.length || 0,
          courses: coursesRes.data.length,
          routines: routinesRes.data.length,
          pendingApprovals: 0, // Will be overridden below for hod/dhod
        });
        // Take the last 5 entries and reverse so newest appears first
        setRecentRoutines(routinesRes.data.slice(-5).reverse());
      } catch (err) {
        console.error(err);
      }
    };

    // Non-teacher roles (hod/dhod) fetch pending approvals count separately
    // This is kept outside Promise.all because it's conditional on role
    if (teacher?.role !== 'teacher') {
      api.get('/approvals', { params: { status: 'pending' } })
        .then(res => setStats(prev => ({ ...prev, pendingApprovals: res.data.length })))
        .catch(() => {});
    }
    fetchData();
  }, [teacher]);

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Dashboard</h2>
      {/* Stats grid: displays 4 metric cards. The Pending Approvals card is
          conditionally rendered — only hod/dhod roles see it since teachers
          don't manage approvals. */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Teachers</h3>
          <div className="stat-value">{stats.teachers}</div>
        </div>
        <div className="stat-card">
          <h3>Total Subjects</h3>
          <div className="stat-value">{stats.courses}</div>
        </div>
        <div className="stat-card">
          <h3>Routine Entries</h3>
          <div className="stat-value">{stats.routines}</div>
        </div>
        {(teacher?.role === 'hod' || teacher?.role === 'dhod') && (
          <div className="stat-card">
            <h3>Pending Approvals</h3>
            <div className="stat-value">{stats.pendingApprovals}</div>
          </div>
        )}
      </div>

      {/* Profile card: displays the logged-in teacher's details from AuthContext.
          Uses optional chaining (teacher?.name) to guard against null/undefined
          while the context is loading. */}
      <div className="card">
        <div className="card-title">Your Profile</div>
        <div className="form-row">
          <div className="form-group">
            <label>Name</label>
            <div style={{ padding: '8px 0' }}>{teacher?.name}</div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <div style={{ padding: '8px 0' }}>{teacher?.email}</div>
          </div>
          <div className="form-group">
            <label>Role</label>
            <div style={{ padding: '8px 0' }}>
              <span className={`badge badge-${teacher?.role}`}>{teacher?.role?.toUpperCase()}</span>
            </div>
          </div>
          <div className="form-group">
            <label>Department</label>
            <div style={{ padding: '8px 0' }}>{teacher?.department_code}</div>
          </div>
          <div className="form-group">
            <label>Designation</label>
            <div style={{ padding: '8px 0' }}>{teacher?.designation}</div>
          </div>
          <div className="form-group">
            <label>Max Hours/Week</label>
            <div style={{ padding: '8px 0' }}>{teacher?.max_hours_per_week}h</div>
          </div>
        </div>
      </div>

      {/* Recent routine entries table: only renders when there is data to show,
          preventing an empty table box from appearing. */}
      {recentRoutines.length > 0 && (
        <div className="card">
          <div className="card-title">Recent Routine Entries</div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Course</th>
                  <th>Type</th>
                  <th>Room</th>
                </tr>
              </thead>
              <tbody>
                {recentRoutines.map(r => (
                  <tr key={r._id}>
                    <td>{r.day}</td>
                    <td>{r.startTime} - {r.endTime}</td>
                    <td>{r.course_code}</td>
                    <td>{r.type}</td>
                    <td>{r.room || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
