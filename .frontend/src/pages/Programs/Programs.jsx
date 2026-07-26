import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function Programs() {
  const [programs, setPrograms] = useState([]);

  // Fetch once on mount; this is a read-only page with no mutations,
  // so no refresh trigger is needed
  useEffect(() => { fetchPrograms(); }, []);

  const fetchPrograms = async () => {
    const { data } = await api.get('/programs');
    setPrograms(data);
  };

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Programs</h2>
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Full Name</th>
                <th>Department</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {programs.map(p => (
                <tr key={p._id}>
                  <td><strong>{p.code}</strong></td>
                  <td>{p.fullName}</td>
                  {/* department_code maps this program to its parent department */}
                  <td>{p.department_code}</td>
                  <td>{p.duration_years} years</td>
                </tr>
              ))}
              {programs.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 24 }}>No programs found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
