// Routines page ("Edit Routine") — the core planning screen for HoD/DHoD:
// create/edit/delete and approve routine entries. Teachers never see this
// page (their own weekly view is the TeacherSchedule page). Supports
// co-taught sessions, alternate-week practicals, and parallel elective options.
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
// electiveOptions holds the parallel elective offerings for an elective slot
// (each row = subject name + teacher), e.g. "A" -> NN, "B" -> MM, ...
// additional_teachers lets one subject/slot be co-taught by several faculty
// ("Add More Teachers" appends a row). week marks alternate-week practicals
// ('every' | 'odd' | 'even') and note is a free-text remark shown alongside.
const INIT_FORM = {
  day: 'Monday', startTime: '09:15', endTime: '10:00',
  program: '', year: '', part: '', subject_id: '', course_code: '',
  teacher_id: '', section: '', group: '', type: 'L',
  electiveOptions: [], additional_teachers: [], note: '', room: '', week: 'every',
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
    // Reference data for the create/edit modal (teachers, programs, subjects).
    fetchTeachers();
    fetchPrograms();
    fetchSubjects();
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

  // getEntryTeachers lists every name on an entry: the primary teacher plus
  // any co-teachers in additional_teachers (populated objects or raw ids).
  const getEntryTeachers = (r) => {
    const primary = r.teacher_id ? [getTeacherName(r.teacher_id)] : [];
    const extras = (r.additional_teachers || [])
      .map(t => getTeacherName(t))
      .filter(n => n && n !== '-');
    return [...primary, ...extras];
  };

  // Week labels for the odd/even alternate-week practicals.
  const weekLabel = (w) => w === 'odd' ? 'Odd weeks' : w === 'even' ? 'Even weeks' : '';

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

  // selectedSubject is the course currently chosen in the form; isElective is
  // true when that course is an elective (code or title mentions "Elective"),
  // in which case the single teacher select is replaced by the parallel
  // elective options editor (one subject name + teacher per offered elective).
  const selectedSubject = subjects.find(s => s._id === form.subject_id);
  const isElective = selectedSubject
    ? /elective/i.test(`${selectedSubject.code} ${selectedSubject.title}`)
    : false;

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
  // A and B), plus one "Both" entry whose value is the whole section — a
  // practical covering both groups at once stores the section as its group.
  const selectedProgram = programs.find(p => p.code === form.program);
  const sectionOptions = selectedProgram?.sections || [];
  const groupOptions = form.section ? [...form.section.split(''), form.section] : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Non-practical entries belong to the whole section, so they never
      // carry a group.
      const group = form.type === 'P' ? form.group : '';
      if (isElective) {
        // Elective slots need at least one option (subject name + teacher);
        // incomplete rows are silently dropped so partial input never
        // creates a half-defined elective block.
        const options = form.electiveOptions.filter(o => o.subject_name && o.teacher_id);
        if (!options.length) {
          alert('Add at least one elective option (subject name and teacher)');
          return;
        }
        if (editData) {
          await api.put(`/routines/${editData._id}`, { ...form, group, electiveOptions: options });
        } else {
          await api.post('/routines', { ...form, group, electiveOptions: options });
        }
      } else {
        // Co-teachers: dedupe and drop any row that repeats the primary
        // teacher — one entry, one subject, multiple distinct faculty.
        const additional = [...new Set(form.additional_teachers.filter(Boolean))]
          .filter(id => id !== form.teacher_id);
        const payload = {
          ...form,
          group,
          note: form.note || '',
          week: form.week || 'every',
          additional_teachers: additional,
          electiveOptions: [],
        };
        if (editData) {
          await api.put(`/routines/${editData._id}`, payload);
        } else {
          await api.post('/routines', payload);
        }
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
    // Editing an elective entry prefills every option of the block by
    // collecting all routines sharing the same elective_group (the list is
    // already loaded in memory for hod/dhod, who are the only editors).
    const electiveOptions = r.is_elective && r.elective_group
      ? routines
          .filter(x => x.elective_group === r.elective_group)
          .map(x => ({
            subject_name: x.subject_name || '',
            teacher_id: typeof x.teacher_id === 'object' ? x.teacher_id._id : (x.teacher_id || ''),
          }))
      : [{ subject_name: '', teacher_id: '' }];
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
      note: r.note || '',
      room: r.room || '',
      week: r.week || 'every',
      additional_teachers: (r.additional_teachers || []).map(t =>
        typeof t === 'object' ? t._id : t
      ),
      electiveOptions,
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
        <h2>Edit Routine</h2>
        {/* Add Entry — opens the create form; the page is hod/dhod-only */}
        {isHodOrDhod && (
          <button className="btn btn-primary" onClick={() => { setEditData(null); setForm(INIT_FORM); setShowModal(true); }}>
            + Add Entry
          </button>
        )}
      </div>

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
                <th>Note</th>
                <th>Room</th>
                <th>Status</th>
                {isHodOrDhod && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {routines.map(r => (
                <tr key={r._id}>
                  <td>{r.day}</td>
                  <td>{r.startTime} - {r.endTime}</td>
                  <td>
                    {r.course_code}
                    {r.subject_id?.title && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.subject_id.title}{r.subject_name ? ` — ${r.subject_name}` : ''}</div>}
                  </td>
                  <td>
                    {getEntryTeachers(r).join(', ')}
                  </td>
                  <td>{r.section || '-'}</td>
                  {/* A practical covering the whole section stores the section
                      name as its group — display it as "Both". */}
                  <td>
                    {r.group === r.section ? 'Both' : (r.group || '-')}
                    {r.week && r.week !== 'every' && (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{weekLabel(r.week)}</div>
                    )}
                  </td>
                  <td>{r.program || '-'}</td>
                  <td>{r.type}</td>
                  <td>{r.semester}</td>
                  <td>{r.note || '-'}</td>
                  <td>{r.room || '-'}</td>
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
              {routines.length === 0 && (
                <tr>
                  {/* colSpan adjusts to the number of visible columns
                      depending on whether actions are available */}
                  <td colSpan={isHodOrDhod ? 12 : 11} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 24 }}>No routines found</td>
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
                  {/* Class time runs 09:15–16:45, enforced on the pickers. */}
                  <input className="form-control" type="time" min="09:15" max="16:45" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input className="form-control" type="time" min="09:15" max="16:45" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} required />
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
                  tutorials cover the whole section at once. "Both" (the whole
                  section) is also offered for practicals run by both groups
                  together. */}
              {form.type === 'P' && (
                <div className="form-group">
                  <label>Group</label>
                  <select className="form-control" value={form.group} onChange={e => setForm({ ...form, group: e.target.value })} required disabled={!form.section}>
                    <option value="">Select Group</option>
                    {groupOptions.map(g => (
                      <option key={g} value={g}>
                        {g === form.section ? `Both Groups (${g.split('').join(' + ')})` : `Group ${g}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-row">
                <div className="form-group">
                  <label>Week</label>
                  {/* Alternate-week practicals: "Odd"/"Even" means the entry
                      runs only on odd or even weeks, e.g. Simulation one week
                      and AI the next in the same slot. */}
                  <select className="form-control" value={form.week} onChange={e => setForm({ ...form, week: e.target.value })}>
                    <option value="every">Every Week</option>
                    <option value="odd">Odd Weeks Only</option>
                    <option value="even">Even Weeks Only</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Room No (optional)</label>
                  <input
                    className="form-control"
                    type="text"
                    placeholder="e.g. 203, Lab-1"
                    value={form.room}
                    onChange={e => setForm({ ...form, room: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Note (optional)</label>
                  <input
                    className="form-control"
                    type="text"
                    placeholder="e.g. Lab room 203, combined with section CD"
                    value={form.note}
                    onChange={e => setForm({ ...form, note: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Course</label>
                <select className="form-control" value={form.subject_id} onChange={e => {
                  const next = subjects.find(s => s._id === e.target.value);
                  const elective = next ? /elective/i.test(`${next.code} ${next.title}`) : false;
                  setForm({
                    ...form,
                    subject_id: e.target.value,
                    // Seed one empty row so an elective slot starts with an
                    // editable option instead of an empty editor.
                    electiveOptions: elective ? [{ subject_name: '', teacher_id: '' }] : [],
                  });
                }} required disabled={!form.part}>
                  <option value="">Select Course</option>
                  {courseOptions.map(s => <option key={s._id} value={s._id}>{s.code} — {s.title}</option>)}
                </select>
              </div>
              {/* Elective courses run as several parallel options in the same
                  slot, each with its own subject name and teacher (e.g. "A"
                  taught by NN, "B" taught by MM). Rows can be added/removed;
                  incomplete rows are ignored on submit. Non-elective courses
                  use the single teacher select below instead. */}
              {isElective ? (
                <div className="form-group">
                  <label>Elective Options (courses offered in this slot)</label>
                  {form.electiveOptions.map((opt, i) => (
                    <div key={i} className="form-row" style={{ alignItems: 'center', marginBottom: 8 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <input
                          className="form-control"
                          placeholder="Subject name (e.g. AI and Machine Learning)"
                          value={opt.subject_name}
                          onChange={e => {
                            const next = [...form.electiveOptions];
                            next[i] = { ...next[i], subject_name: e.target.value };
                            setForm({ ...form, electiveOptions: next });
                          }}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <select
                          className="form-control"
                          value={opt.teacher_id}
                          onChange={e => {
                            const next = [...form.electiveOptions];
                            next[i] = { ...next[i], teacher_id: e.target.value };
                            setForm({ ...form, electiveOptions: next });
                          }}
                          disabled={!form.program}
                        >
                          <option value="">Select Teacher</option>
                          {teacherOptions.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                        </select>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => setForm({ ...form, electiveOptions: form.electiveOptions.filter((_, j) => j !== i) })}
                        disabled={form.electiveOptions.length <= 1}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => setForm({ ...form, electiveOptions: [...form.electiveOptions, { subject_name: '', teacher_id: '' }] })}
                  >
                    + Add Elective Option
                  </button>
                </div>
              ) : (
                <div className="form-group">
                  <label>Teacher</label>
                  <select className="form-control" value={form.teacher_id} onChange={e => setForm({ ...form, teacher_id: e.target.value })} required disabled={!form.program}>
                    <option value="">Select Teacher</option>
                    {teacherOptions.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                  {/* Co-taught sessions: "+ Add More Teachers" appends extra
                      teacher rows for the same subject and slot. Rows repeat
                      the teacher select; the primary teacher is filtered out
                      on submit. */}
                  {form.additional_teachers.map((tid, i) => (
                    <div key={i} className="form-row" style={{ alignItems: 'center', marginTop: 8 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <select
                          className="form-control"
                          value={tid}
                          onChange={e => {
                            const next = [...form.additional_teachers];
                            next[i] = e.target.value;
                            setForm({ ...form, additional_teachers: next });
                          }}
                          disabled={!form.program}
                        >
                          <option value="">Select Additional Teacher</option>
                          {teacherOptions.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                        </select>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => setForm({ ...form, additional_teachers: form.additional_teachers.filter((_, j) => j !== i) })}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    style={{ marginTop: 8 }}
                    onClick={() => setForm({ ...form, additional_teachers: [...form.additional_teachers, ''] })}
                    disabled={!form.program || !form.teacher_id}
                  >
                    + Add More Teachers
                  </button>
                </div>
              )}
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