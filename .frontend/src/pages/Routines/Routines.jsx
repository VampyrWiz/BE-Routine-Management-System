import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

// Teaching week runs Monday to Friday.
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TYPES = ['L', 'T', 'P'];
// INIT_FORM serves as the default state for creating a new routine entry.
// Program → Year → Part drive which subjects (courses) are available, so the
// user never types codes manually; the backend derives course_code, semester
// and program from the chosen subject.
const INIT_FORM = {
  day: 'Monday', startTime: '06:00', endTime: '07:00',
  program: '', year: '', part: '', subject_id: '', course_code: '',
  teacher_id: '', section: '', group: '', type: 'L',
};

export default function Routines() {
  const { teacher } = useAuth();
  const [routines, setRoutines] = useState([]);
  // Reference data for the modal: teachers (for the teacher dropdown),
  // programs (for the program dropdown) and all subjects (filtered locally
  // by program + year + part so the course list is always in sync).
  const [teachers, setTeachers] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [form, setForm] = useState(INIT_FORM);

  // Derived boolean — used throughout to conditionally render admin features
  // like add/edit/delete buttons and the approve action
  const isHodOrDhod = teacher?.role === 'hod' || teacher?.role === 'dhod';

  useEffect(() => {
    fetchRoutines();
    // Only hod/dhod need the reference data for the create/edit modal;
    // teachers don't create/edit routines so they don't need this data
    if (isHodOrDhod) {
      fetchTeachers();
      fetchPrograms();
      fetchSubjects();
    }
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

  const fetchPrograms = async () => {
    try {
      const { data } = await api.get('/programs');
      setPrograms(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Subjects are fetched once without filters and scoped client-side;
  // the curriculum data is small enough that cascading requests per
  // program/year/part change would be wasteful.
  const fetchSubjects = async () => {
    try {
      const { data } = await api.get('/subjects');
      setSubjects(data);
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

  // Cascading option lists derived from the fetched subjects.
  // Only the options that make sense for the currently selected program
  // (and year) are shown, so the routine always matches the curriculum.
  const yearOptions = [...new Set(
    subjects.filter(s => !form.program || (s.program || '').split(',').map(x => x.trim().toUpperCase()).includes(form.program.toUpperCase()))
      .map(s => s.year)
  )].sort((a, b) => a - b);

  const partOptions = [...new Set(
    subjects.filter(s => (s.year === Number(form.year)) && (!form.program || (s.program || '').split(',').map(x => x.trim().toUpperCase()).includes(form.program.toUpperCase())))
      .map(s => s.part)
  )].sort((a, b) => a - b);

  const courseOptions = subjects.filter(s =>
    (!form.program || (s.program || '').split(',').map(x => x.trim().toUpperCase()).includes(form.program.toUpperCase())) &&
    (!form.year || s.year === Number(form.year)) &&
    (!form.part || s.part === Number(form.part))
  ).sort((a, b) => a.code.localeCompare(b.code));

    // Teachers are scoped to the selected program so that a department running
    // multiple programs (e.g. DOECE with BCT and BEX) only offers relevant
    // faculty. Without a program selected (e.g. editing a legacy entry) all
    // teachers are shown.
    const teacherOptions = !form.program
      ? teachers
      : teachers.filter(t =>
          (t.programs || []).map(p => p.toUpperCase()).includes(form.program.toUpperCase())
        );

  // Sections come from the chosen program's config (e.g. BCT -> ["AB","CD"]).
  // Groups are the letters inside the section name (section "AB" has groups
  // A and B), so no extra lookup table is needed.
  const selectedProgram = programs.find(p => p.code === form.program);
  const sectionOptions = selectedProgram?.sections || [];
  const groupOptions = form.section ? form.section.split('') : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Non-practical entries belong to the whole section, so they never
      // carry a group.
      const payload = { ...form, group: form.type === 'P' ? form.group : '' };
      if (editData) {
        await api.put(`/routines/${editData._id}`, payload);
      } else {
        await api.post('/routines', payload);
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
  // The day field from the API may come as an abbreviated form ("Mon"),
  // so dayTime maps abbreviations to full names for the dropdown to match.
  // year/part are parsed back out of the stored semester string so the
  // cascading selects land on the right subject.
  const handleEdit = (r) => {
    const dayTime = (d) => {
      const dayMapping = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday' };
      return dayMapping[d?.day] || d?.day || 'Monday';
    };
    const parseSemester = (sem) => {
      const m = /Year\s([IV]+):\sPart\s([I]+)/i.exec(sem || '');
      if (!m) return { year: '', part: '' };
      const yearNum = ['I', 'II', 'III', 'IV', 'V'].indexOf(m[1].toUpperCase()) + 1;
      const partNum = ['I', 'II'].indexOf(m[2].toUpperCase()) + 1;
      return { year: yearNum || '', part: partNum || '' };
    };
    const { year, part } = parseSemester(r.semester);
    setEditData(r);
    setForm({
      day: dayTime(r),
      startTime: r.startTime || '06:00',
      endTime: r.endTime || '07:00',
      program: r.program || '',
      year: year || '',
      part: part || '',
      subject_id: r.subject_id?._id || r.subject_id || '',
      course_code: r.course_code || '',
      // Extract the ID if teacher_id is a populated object, otherwise use raw value
      teacher_id: typeof r.teacher_id === 'object' ? r.teacher_id._id : (r.teacher_id || ''),
      section: r.section || '',
      group: r.group || '',
      type: r.type || 'L',
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
        <h2>Teacher Schedule</h2>
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
                <th>Course</th>
                <th>Teacher</th>
                <th>Section</th>
                <th>Group</th>
                <th>Program</th>
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
                  <td>
                    {r.course_code}
                    {r.subject_id?.title && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.subject_id.title}</div>}
                  </td>
                  <td>{getTeacherName(r.teacher_id)}</td>
                  <td>{r.section || '-'}</td>
                  <td>{r.group || '-'}</td>
                  <td>{r.program || '-'}</td>
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
                  <td colSpan={isHodOrDhod ? 11 : 10} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 24 }}>No routines found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal form for creating/editing routine entries. Selecting a Program
          first, then Year, then Part cascades the available courses down to
          only those subjects in the curriculum for that combination, so codes
          are picked rather than typed. The teacher dropdown is likewise
          scoped to the chosen program. Room was dropped — no field for it. */}
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
                  {/* Choosing a type other than P clears the group: groups
                      only exist for practicals — lectures and tutorials run
                      for the whole section. */}
                  <select className="form-control" value={form.type} onChange={e => setForm({ ...form, type: e.target.value, group: '' })} required>
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
                  <label>Program</label>
                  <select className="form-control" value={form.program} onChange={e => setForm({ ...form, program: e.target.value, year: '', part: '', subject_id: '' })} required>
                    <option value="">Select Program</option>
                    {programs.map(p => <option key={p.code} value={p.code}>{p.code} — {p.fullName}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Year</label>
                  <select className="form-control" value={form.year} onChange={e => setForm({ ...form, year: e.target.value, part: '', subject_id: '' })} required disabled={!form.program}>
                    <option value="">Select Year</option>
                    {yearOptions.map(y => <option key={y} value={y}>{['I', 'II', 'III', 'IV', 'V'][y - 1] || y}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Part</label>
                  <select className="form-control" value={form.part} onChange={e => setForm({ ...form, part: e.target.value, subject_id: '' })} required disabled={!form.year}>
                    <option value="">Select Part</option>
                    {partOptions.map(p => <option key={p} value={p}>{['I', 'II'][p - 1] || p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Section</label>
                  <select className="form-control" value={form.section} onChange={e => setForm({ ...form, section: e.target.value, group: '' })} required disabled={!form.part}>
                    <option value="">Select Section</option>
                    {sectionOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              {/* Group is only offered for practicals (P): a practical batch
                  belongs to one group inside the section, while lectures and
                  tutorials cover the whole section at once. */}
              {form.type === 'P' && (
                <div className="form-group">
                  <label>Group</label>
                  <select className="form-control" value={form.group} onChange={e => setForm({ ...form, group: e.target.value })} required disabled={!form.section}>
                    <option value="">Select Group</option>
                    {groupOptions.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>Course</label>
                <select className="form-control" value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })} required disabled={!form.part}>
                  <option value="">Select Course</option>
                  {courseOptions.map(s => <option key={s._id} value={s._id}>{s.code} — {s.title}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Teacher</label>
                <select className="form-control" value={form.teacher_id} onChange={e => setForm({ ...form, teacher_id: e.target.value })} required disabled={!form.program}>
                  <option value="">Select Teacher</option>
                  {teacherOptions.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
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