// Departments page — read-only reference list of the college's departments
// (short code + full name), the organisational grouping for the whole system.
import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function Departments() {
  const [departments, setDepartments] = useState([]);

  // Read-only page: fetch all departments on mount with no create/edit/delete UI
  useEffect(() => { fetchDepartments(); }, []);

  const fetchDepartments = async () => {
    try {
      const { data } = await api.get('/departments');
      setDepartments(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Departments</h2>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Full Name</th>
              </tr>
            </thead>
            <tbody>
              {departments.map(d => (
                <tr key={d._id}>
                  <td>{d.code}</td>
                  {/* fullName matches the backend model field name (camelCase) */}
                  <td>{d.fullName}</td>
                </tr>
              ))}
              {departments.length === 0 && (
                <tr>
                  <td colSpan={2} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 24 }}>No departments found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
