// TeacherStats — weekly teaching load for every teacher: total hours,
// class count, theory (L+T) vs practical (P) split, and free hours left
// against each teacher's max_hours_per_week. Data comes from the
// /teachers/stats aggregation endpoint. HoD/DHoD only.
import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function TeacherStats() {
  const [rows, setRows] = useState([]);
  // Filters: department select + name search, both client-side
  const [dept, setDept] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/teachers/stats')
      .then(({ data }) => setRows(data))
      .catch(() => {});
  }, []);

  const departments = [...new Set(rows.map(r => r.department_code))].sort();
  const filtered = rows.filter(r =>
    (!dept || r.department_code === dept) &&
    (!search || r.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Teacher Statistics</h2>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="form-row">
          <div className="form-group">
            <label>Department</label>
            <select className="form-control" value={dept} onChange={e => setDept(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Search by name</label>
            <input className="form-control" value={search} onChange={e => setSearch(e.target.value)} placeholder="e.g. Sharma" />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Dept</th>
                <th>Role</th>
                <th>Classes/Week</th>
                <th>Theory (L+T)</th>
                <th>Labs (P)</th>
                <th>Total Hours/Week</th>
                <th>Free Hours</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t._id}>
                  <td>{t.name}</td>
                  <td>{t.department_code}</td>
                  <td><span className={`badge ${t.role === 'hod' ? 'badge-hod' : t.role === 'dhod' ? 'badge-dhod' : 'badge-teacher'}`}>{t.role.toUpperCase()}</span></td>
                  <td>{t.classes}</td>
                  <td>{t.theoryHours}h</td>
                  <td>{t.labHours}h</td>
                  {/* "x / max" so over-limit teachers are obvious at a glance */}
                  <td>{t.totalHours} / {t.max_hours_per_week}h</td>
                  <td style={{ color: t.freeHours <= 0 ? 'var(--danger)' : undefined }}>
                    {t.freeHours}h
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 20 }}>No teachers found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
