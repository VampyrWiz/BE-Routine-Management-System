import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
const TYPES = ['L', 'T', 'P'];
// INIT_FORM serves as the default state for creating a new routine entry.
// It is also used to reset the form after submission or when opening the
// "add" modal, ensuring the form always starts in a clean, predictable state.
const INIT_FORM = {
  day: 'Sunday', startTime: '06:00', endTime: '07:00',
  course_code: '', teacher_id: '', section: '', room: '',
  type: 'L', semester: 'Year I: Part I',
};

export default function Routines() {
  const { teacher } = useAuth();
  const [routines, setRoutines] = useState([]);
  // teachers list is fetched separately (only by hod/dhod) for the teacher
  // dropdown in the modal form
  const [teachers, setTeachers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [form, setForm] = useState(INIT_FORM);

  // Derived boolean — used throughout to conditionally render admin features
  // like add/edit/delete buttons and the approve action
  const isHodOrDhod = teacher?.role === 'hod' || teacher?.role === 'dhod';

  useEffect(() => {
    fetchRoutines();
    // Only hod/dhod need the teacher list for the teacher dropdown in the modal;
    // teachers don't create/edit routines so they don't need this data
    if (isHodOrDhod) fetchTeachers();
  }, [teacher]);

  const fetchRoutines = async () => {
    try {
      const { data } = await api.get('/routines');
      setRoutines(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTeachers = async () => {
    try {
      const { data } = await api.get('/teachers');
      setTeachers(data);
    } catch (err) {
      console.error(err);
    }
  };

  // filteredRoutines: teachers see only their own assigned routines, while
  // hod/dhod see all entries. The teacher_id field can be either a populated
  // object (from server-side population) or a raw ID string, so we handle
  // both cases with typeof checks.
  const filteredRoutines = teacher?.role === 'teacher'
    ? routines.filter(r => {
        const tid = typeof r.teacher_id === 'object' ? r.teacher_id?._id : r.teacher_id;
        return tid === teacher._id;
      })
    : routines;

  // getTeacherName resolves a teacher reference to a display name.
  // The teacher_id can be:
  //   1. A populated object with a .name property (from API with population)
  //   2. A raw ID string (when the API returns the ID only)
  //   3. null/undefined
  // For case 2, we look up the name from the local teachers array (loaded by
  // hod/dhod on mount). Returns '-' if no match is found.
  const getTeacherName = (t) => {
    if (!t) return '-';
    if (typeof t === 'object') return t.name || '-';
    const found = teachers.find(tc => tc._id === t);
    return found ? found.name : t;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editData) {
        await api.put(`/routines/${editData._id}`, form);
      } else {
        await api.post('/routines', form);
      }
      setShowModal(false);
      setEditData(null);
      setForm(INIT_FORM);
      fetchRoutines();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving routine');
    }
  };

  // handleEdit pre-fills the form with existing routine data.
  // The day field from the API may come as an abbreviated form ("Sun"),
  // so dayTime maps abbreviations to full names for the dropdown to match.
  const handleEdit = (r) => {
    const dayTime = (d) => {
      const dayMapping = { Sun: 'Sunday', Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday' };
      return dayMapping[d?.day] || d?.day || 'Sunday';
    };
    setEditData(r);
    setForm({
      day: dayTime(r),
      startTime: r.startTime || '06:00',
      endTime: r.endTime || '07:00',
      course_code: r.course_code || '',
      // Extract the ID if teacher_id is a populated object, otherwise use raw value
      teacher_id: typeof r.teacher_id === 'object' ? r.teacher_id._id : (r.teacher_id || ''),
      section: r.section || '',
      room: r.room || '',
      type: r.type || 'L',
      semester: r.semester || 'Year I: Part I',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this routine entry?')) return;
    try {
      await api.delete(`/routines/${id}`);
      fetchRoutines();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting routine');
    }
  };

  // handleApprove is only available to hod (not dhod) and only on entries
  // where isApproved is false. It calls a dedicated approve endpoint.
  const handleApprove = async (id) => {
    if (!confirm('Approve this routine?')) return;
    try {
      await api.put(`/routines/${id}/approve`);
      fetchRoutines();
    } catch (err) {
      alert(err.response?.data?.message || 'Error approving routine');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Routines</h2>
        {/* Add Entry button is gated by isHodOrDhod — teachers cannot create entries */}
        {isHodOrDhod && (
          <button className="btn btn-primary" onClick={() => { setEditData(null); setForm(INIT_FORM); setShowModal(true); }}>
            + Add Entry
          </button>
        )}
      </div>

      {/* Informational banner for teachers: clarifies why they see fewer entries */}
      {teacher?.role === 'teacher' && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          Showing your assigned routines only.
        </div>
      )}

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Day</th>
                <th>Time</th>
                <th>Course Code</th>
                <th>Teacher</th>
                <th>Section</th>
                <th>Room</th>
                <th>Type</th>
                <th>Semester</th>
                <th>Status</th>
                {isHodOrDhod && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredRoutines.map(r => (
                <tr key={r._id}>
                  <td>{r.day}</td>
                  <td>{r.startTime} - {r.endTime}</td>
                  <td>{r.course_code}</td>
                  <td>{getTeacherName(r.teacher_id)}</td>
                  <td>{r.section || '-'}</td>
                  <td>{r.room || '-'}</td>
                  <td>{r.type}</td>
                  <td>{r.semester}</td>
                  <td>
                    {/* Status badge: color-coded pills for Approved vs Pending */}
                    {r.isApproved
                      ? <span className="badge badge-approved">Approved</span>
                      : <span className="badge badge-pending">Pending</span>
                    }
                  </td>
                  {/* Actions column: Edit, Delete (for hod/dhod) and Approve
                      (only for hod, and only on unapproved entries). This keeps
                      the UI clean by hiding irrelevant actions. */}
                  {isHodOrDhod && (
                    <td>
                      <button className="btn btn-sm btn-primary" onClick={() => handleEdit(r)} style={{ marginRight: 4 }}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(r._id)} style={{ marginRight: 4 }}>Del</button>
                      {!r.isApproved && (
                        <button className="btn btn-sm btn-success" onClick={() => handleApprove(r._id)}>Approve</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {filteredRoutines.length === 0 && (
                <tr>
                  {/* colSpan adjusts to the number of visible columns
                      depending on whether actions are available */}
                  <td colSpan={isHodOrDhod ? 10 : 9} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 24 }}>No routines found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal form for creating/editing routine entries. Fields include day
          (select), type (L/T/P), start/end time (time inputs), course code
          (text), teacher (dropdown from fetched teachers list), section, room,
          and semester (select with all 8 semester options). */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editData ? 'Edit Routine' : 'Add Routine'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Day</label>
                  <select className="form-control" value={form.day} onChange={e => setForm({ ...form, day: e.target.value })} required>
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select className="form-control" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} required>
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Time</label>
                  <input className="form-control" type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input className="form-control" type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Course Code</label>
                  <input className="form-control" value={form.course_code} onChange={e => setForm({ ...form, course_code: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Teacher</label>
                  <select className="form-control" value={form.teacher_id} onChange={e => setForm({ ...form, teacher_id: e.target.value })} required>
                    <option value="">Select Teacher</option>
                    {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Section</label>
                  <input className="form-control" value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Room</label>
                  <input className="form-control" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Semester</label>
                <select className="form-control" value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })} required>
                  {['Year I: Part I', 'Year I: Part II', 'Year II: Part I', 'Year II: Part II',
                    'Year III: Part I', 'Year III: Part II', 'Year IV: Part I', 'Year IV: Part II',
                  ].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editData ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
