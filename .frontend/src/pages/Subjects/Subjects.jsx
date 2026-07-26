import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [programs, setPrograms] = useState([]);
  // filter state drives query params sent to the API — changing a dropdown value
  // does NOT auto-fetch; user must click "Filter" button to trigger fetchSubjects
  const [filter, setFilter] = useState({ program: '', year: '', part: '' });
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  // The form state matches the Subject model schema with default values.
  // program is stored as a comma-separated string in the input, but the backend
  // likely receives it and converts to an array of program codes.
  const [form, setForm] = useState({
    code: '', title: '', credits: 0, L: 0, T: 0, P: 0, totalHours: 0,
    theoryAssessmentMarks: 0, theoryFinalMarks: 60, theoryDuration: 3,
    practicalAssessmentMarks: 0, practicalFinalMarks: 0, practicalDuration: 0,
    totalMarks: 0, year: 1, part: 1, semester: 'Year I: Part I', program: '',
  });

  // On mount, fetch both subjects (with current filters) and programs for the filter dropdown
  useEffect(() => { fetchSubjects(); fetchPrograms(); }, []);

  const fetchSubjects = async () => {
    // Only include non-empty filter values in query params to avoid sending
    // empty strings that might confuse the backend
    const params = {};
    if (filter.program) params.program = filter.program;
    if (filter.year) params.year = filter.year;
    if (filter.part) params.part = filter.part;
    const { data } = await api.get('/subjects', { params });
    setSubjects(data);
  };

  const fetchPrograms = async () => {
    try { const { data } = await api.get('/programs'); setPrograms(data); } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editData) {
        await api.put(`/subjects/${editData._id}`, form);
      } else {
        await api.post('/subjects', form);
      }
      setShowModal(false);
      setEditData(null);
      fetchSubjects();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Subjects</h2>
        <button className="btn btn-primary" onClick={() => { setEditData(null); setForm({ ...form, program: '' }); setShowModal(true); }}>+ Add Subject</button>
      </div>

      {/* Filter bar: three dropdown filters (program, year, part) and a Filter button.
          The dropdowns update local state only; the button triggers the API call.
          This separation avoids excessive API calls on every keystroke/change. */}
      <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'end', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Program</label>
          <select className="form-control" value={filter.program} onChange={e => setFilter({ ...filter, program: e.target.value })}>
            <option value="">All</option>
            {programs.map(p => <option key={p.code} value={p.code}>{p.code}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Year</label>
          <select className="form-control" value={filter.year} onChange={e => setFilter({ ...filter, year: e.target.value })}>
            <option value="">All</option>
            <option value="1">I</option><option value="2">II</option><option value="3">III</option><option value="4">IV</option>
            <option value="5">V</option>
          </select>
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Part</label>
          <select className="form-control" value={filter.part} onChange={e => setFilter({ ...filter, part: e.target.value })}>
            <option value="">All</option>
            <option value="1">I</option><option value="2">II</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={fetchSubjects}>Filter</button>
      </div>

      {/* Subject table: shows all subject fields. The Programs column displays
          the comma-separated program string directly from the API. The Semester
          column uses the short label (e.g. "Year I: Part I"). */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Title</th>
                <th>Credits</th>
                <th>L/T/P</th>
                <th>Hrs</th>
                <th>Semester</th>
                <th>Programs</th>
                <th>Marks</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map(s => (
                <tr key={s._id}>
                  <td>{s.code}</td>
                  <td>{s.title}</td>
                  <td>{s.credits}</td>
                  <td>{s.L}/{s.T}/{s.P}</td>
                  <td>{s.totalHours}</td>
                  <td>{s.semester}</td>
                  <td>{s.program || '-'}</td>
                  <td>{s.totalMarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal form for Add/Edit subject. The semester dropdown is dynamically
          generated by mapping over year values [1-5] and part values [1-2],
          rendering human-readable Roman-numeral labels like "Year I: Part I". */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <h3>{editData ? 'Edit Subject' : 'Add Subject'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Code</label>
                  <input className="form-control" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Title</label>
                  <input className="form-control" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Credits</label><input className="form-control" type="number" value={form.credits} onChange={e => setForm({ ...form, credits: Number(e.target.value) })} /></div>
                <div className="form-group"><label>Year</label><input className="form-control" type="number" value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) })} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>L</label><input className="form-control" type="number" value={form.L} onChange={e => setForm({ ...form, L: Number(e.target.value) })} /></div>
                <div className="form-group"><label>T</label><input className="form-control" type="number" value={form.T} onChange={e => setForm({ ...form, T: Number(e.target.value) })} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>P</label><input className="form-control" type="number" value={form.P} onChange={e => setForm({ ...form, P: Number(e.target.value) })} /></div>
                <div className="form-group"><label>Total Hours</label><input className="form-control" type="number" value={form.totalHours} onChange={e => setForm({ ...form, totalHours: Number(e.target.value) })} /></div>
              </div>
              <div className="form-group">
                {/* Program input: text-based where user enters comma-separated
                    program codes (e.g., "BCT, BEX") rather than a multi-select.
                    This is simpler UX but requires the user to know valid codes. */}
                <label>Programs (comma-separated)</label>
                <input className="form-control" value={form.program} onChange={e => setForm({ ...form, program: e.target.value })} placeholder="e.g. BCT, BEX" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Semester</label>
                  <select className="form-control" value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })}>
                    {[1,2,3,4,5].map(y => [1,2].map(p => (
                      <option key={`Y${y}P${p}`} value={`Year ${['I','II','III','IV','V'][y-1]}: Part ${['I','II'][p-1]}`}>
                        {`Year ${['I','II','III','IV','V'][y-1]}: Part ${['I','II'][p-1]}`}
                      </option>
                    )))}
                  </select>
                </div>
                <div className="form-group"><label>Total Marks</label><input className="form-control" type="number" value={form.totalMarks} onChange={e => setForm({ ...form, totalMarks: Number(e.target.value) })} /></div>
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
