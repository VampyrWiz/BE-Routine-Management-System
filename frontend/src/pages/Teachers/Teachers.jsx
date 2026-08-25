// Teachers page — CRUD for teacher accounts. HoD can create/edit/delete any
// teacher; DHoD sees all departments read-only (edits are HoD-only).
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export default function Teachers() {
  const { teacher } = useAuth();
  const [teachers, setTeachers] = useState([]);
  // showModal controls the overlay form for both create and edit flows
  const [showModal, setShowModal] = useState(false);
  // editData is null for "add" mode, or the teacher object for "edit" mode
  const [editData, setEditData] = useState(null);
  // form holds all input values; resetForm() restores defaults for "add" mode
  const [form, setForm] = useState({ name: '', email: '', password: '', contact: '', designation: '', department_code: 'BCT', role: 'teacher', max_hours_per_week: 15, programs: [] });
  // programs list populates the programs checkboxes in the modal
  const [programs, setPrograms] = useState([]);
  // departments list populates the Department select (plus "External")
  const [departments, setDepartments] = useState([]);

  // Fetch teacher list once on mount; no dependency on teacher because the list
  // is read-only data that doesn't change when the session user changes
  useEffect(() => {
    fetchTeachers();
    fetchPrograms();
    fetchDepartments();
  }, []);

  const fetchTeachers = async () => {
    const { data } = await api.get('/teachers');
    setTeachers(data);
  };

  // fetchPrograms loads the program codes used for the Programs checkboxes
  const fetchPrograms = async () => {
    try { const { data } = await api.get('/programs'); setPrograms(data); } catch {}
  };

  // fetchDepartments loads the department codes for the Department select
  const fetchDepartments = async () => {
    try { const { data } = await api.get('/departments'); setDepartments(data); } catch {}
  };

  // toggleProgram adds/removes a program code from the teacher's programs
  // array — used by the checkbox group in the modal.
  const toggleProgram = (code) => {
    setForm(prev => ({
      ...prev,
      programs: prev.programs.includes(code)
        ? prev.programs.filter(p => p !== code)
        : [...prev.programs, code],
    }));
  };

  // handleSubmit is shared by both create and edit:
  // - If editData is set, send PUT with the teacher's _id (exclude password from payload if empty)
  // - Otherwise, send POST with the full form
  // On success, close modal, reset edit state, refresh list
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editData) {
        const payload = { ...form };
        delete payload.password;
        if (!form.password) delete payload.password;
        await api.put(`/teachers/${editData._id}`, payload);
      } else {
        await api.post('/teachers', form);
      }
      setShowModal(false);
      setEditData(null);
      resetForm();
      fetchTeachers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving teacher');
    }
  };

  // handleEdit pre-populates the form from the selected teacher object
  // and switches the modal to "edit" mode (editData is truthy)
  const handleEdit = (t) => {
    setEditData(t);
    setForm({ name: t.name, email: t.email, password: '', contact: t.contact || '', designation: t.designation, department_code: t.department_code, role: t.role, subject_codes: t.subject_codes || [], max_hours_per_week: t.max_hours_per_week, programs: t.programs || [] });
    setShowModal(true);
  };

  // Confirmation dialog before DELETE — simple UX guard without a dedicated modal
  const handleDelete = async (id) => {
    if (!confirm('Delete this teacher?')) return;
    await api.delete(`/teachers/${id}`);
    fetchTeachers();
  };

  // resetForm restores the default form values; used when opening the modal for "add"
  const resetForm = () => {
    setForm({ name: '', email: '', password: '', contact: '', designation: '', department_code: 'BCT', role: 'teacher', max_hours_per_week: 15, programs: [] });
  };

  // Maps role strings to CSS class names for colored badge display
  const roleBadge = { hod: 'badge-hod', dhod: 'badge-dhod', teacher: 'badge-teacher' };

  // Department select options: every department from the collection plus the
  // "External" pseudo-department for external teachers (vendors, guest
  // lecturers, industry partners) who belong to no department.
  const EXTERNAL_DEPT = 'External';
  const deptOptions = [...new Set(
    [...departments.map(d => d.code), EXTERNAL_DEPT, form.department_code].filter(Boolean)
  )];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Teachers</h2>
        {/* Add button is role-gated: only HoD can create new teachers.
            Clicking it resets modal to "add" mode (editData=null). */}
        {teacher?.role === 'hod' && (
          <button className="btn btn-primary" onClick={() => { setEditData(null); resetForm(); setShowModal(true); }}>
            + Add Teacher
          </button>
        )}
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Designation</th>
                <th>Dept</th>
                <th>Role</th>
                <th>Max Hrs</th>
                {/* Actions column header is only rendered for HoD,
                    matching the per-row conditional below. */}
                {teacher?.role === 'hod' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {teachers.map(t => (
                <tr key={t._id}>
                  <td>{t.name}</td>
                  <td>{t.email}</td>
                  <td>{t.designation}</td>
                  <td>{t.department_code === EXTERNAL_DEPT ? 'External' : t.department_code}</td>
                  <td><span className={`badge ${roleBadge[t.role]}`}>{t.role.toUpperCase()}</span></td>
                  <td>{t.max_hours_per_week}h</td>
                  {/* Action buttons (Edit/Del) are role-gated: only HoD can
                      modify or remove teacher records. Other roles see a
                      read-only table. */}
                  {teacher?.role === 'hod' && (
                    <td>
                      <button className="btn btn-sm btn-primary" onClick={() => handleEdit(t)} style={{ marginRight: 6 }}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(t._id)}>Del</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shared modal overlay for both Add and Edit. Clicking the overlay
          background closes the modal (e.stopPropagation on the modal content
          prevents this when clicking inside the dialog). */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editData ? 'Edit Teacher' : 'Add Teacher'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Name</label>
                  <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input className="form-control" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                </div>
              </div>
              {/* Password is only shown for new teachers; if left blank the
                  server auto-generates one from the teacher's first name + "123"
                  so the HoD does not have to invent a credential on the spot.
                  For edits the field is hidden — leaving it empty on the server
                  preserves the existing password. */}
              {!editData && (
                <div className="form-group">
                  <label>Password (leave blank for auto-generate)</label>
                  <input className="form-control" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                </div>
              )}
              <div className="form-row">
                <div className="form-group">
                  <label>Designation</label>
                  <input className="form-control" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Contact</label>
                  <input className="form-control" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  {/* External teachers (not tied to any department) are picked
                      from the same select via the "External" option. */}
                  <label>Department</label>
                  <select className="form-control" value={form.department_code} onChange={e => setForm({ ...form, department_code: e.target.value })}>
                    {deptOptions.map(code => (
                      <option key={code} value={code}>
                        {code === EXTERNAL_DEPT ? 'External (no department)' : code}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select className="form-control" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    <option value="teacher">Teacher</option>
                    <option value="dhod">DHoD</option>
                    <option value="hod">HoD</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Max Hours/Week</label>
                <input className="form-control" type="number" value={form.max_hours_per_week} onChange={e => setForm({ ...form, max_hours_per_week: Number(e.target.value) })} />
              </div>
              {/* Programs: checkboxes of all program codes. The routine form
                  filters its teacher dropdown by these, so a teacher must be
                  tagged with the program(s) they teach to be assignable. */}
              <div className="form-group">
                <label>Programs</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: '8px 0' }}>
                  {programs.map(p => (
                    <label key={p.code} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.programs.includes(p.code)} onChange={() => toggleProgram(p.code)} />
                      {p.code}
                    </label>
                  ))}
                  {programs.length === 0 && <span style={{ color: 'var(--text-secondary)' }}>No programs available</span>}
                </div>
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
