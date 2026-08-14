import { useState, useEffect } from 'react';
import api from '../../api/axios';

// Teaching week runs Monday to Friday — columns of the timetable grid.
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// toRoman converts a 1-based year/part number to the Roman numeral used in
// the semester string (e.g. 2 -> "II" so "Year II: Part I").
const toRoman = (n) => ['I', 'II', 'III', 'IV', 'V'][Number(n) - 1] || n;

// getTeacherAbbrev builds a short code from a teacher name (e.g. "Aman
// Shakya" -> "AS"). Honorifics and middle initials are ignored so the code
// reads as first + last name.
const TITLES = ['prof', 'dr', 'mr', 'mrs', 'ms', 'er', 'eng'];
const getTeacherAbbrev = (name) => {
  const words = (name || '')
    .replace(/\./g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter(w => !TITLES.includes(w.toLowerCase()));
  if (!words.length) return (name || '').trim() || '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

// INIT_FILTER drives the cascading Program -> Year -> Part -> Section ->
// Group selects. Group is optional: "All Groups" shows the whole section,
// where parallel practicals of the same course merge into one cell.
const INIT_FILTER = { program: '', year: '', part: '', section: '', group: '' };

export default function SectionSchedule() {
  const [routines, setRoutines] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filter, setFilter] = useState(INIT_FILTER);

  useEffect(() => {
    fetchRoutines();
    fetchPrograms();
    // Subjects drive the year/part cascade, mirroring the routine form.
    fetchSubjects();
  }, []);

  const fetchRoutines = async () => {
    try {
      const { data } = await api.get('/routines');
      setRoutines(data);
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

  const fetchSubjects = async () => {
    try {
      const { data } = await api.get('/subjects');
      setSubjects(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Cascading option lists, derived from the curriculum exactly like the
  // routine creation form so the selected section always matches reality.
  const yearOptions = [...new Set(
    subjects.filter(s => !filter.program || (s.program || '').split(',').map(x => x.trim().toUpperCase()).includes(filter.program.toUpperCase()))
      .map(s => s.year)
  )].sort((a, b) => a - b);

  const partOptions = [...new Set(
    subjects.filter(s => (s.year === Number(filter.year)) && (!filter.program || (s.program || '').split(',').map(x => x.trim().toUpperCase()).includes(filter.program.toUpperCase())))
      .map(s => s.part)
  )].sort((a, b) => a - b);

  // Sections come from the chosen program's config (e.g. BCT -> ["AB","CD"]),
  // and groups are the letters inside the section name (section "AB" holds
  // groups A and B). Both are stable curriculum facts, so they never depend
  // on whether routines exist yet.
  const selectedProgram = programs.find(p => p.code === filter.program);
  const sectionOptions = selectedProgram?.sections || [];
  const groupOptions = filter.section ? ['', ...filter.section.split('')] : [];

  // semesterString rebuilds "Year II: Part I" from the numeric year/part so
  // it can be matched against the semester field stored on each routine.
  const semesterString = (y, p) =>
    (y && p) ? `Year ${toRoman(Number(y))}: Part ${toRoman(Number(p))}` : '';

  // Entries shown in the grid: only the chosen program/year/part/section.
  // Entries without a group (lectures/tutorials, which run for the whole
  // section) are shown for any selected group, while practicals are shown
  // only for their own group — or for all groups when "All Groups" is chosen.
  const sectionRoutines = routines.filter(r =>
    (!filter.program || r.program === filter.program) &&
    (!filter.year || r.semester === semesterString(filter.year, filter.part)) &&
    (!filter.section || r.section === filter.section) &&
    (!filter.group || !r.group || r.group === filter.group)
  );

  // Time slots are the rows of the grid: unique start-end pairs sorted by
  // start time (HH:MM zero-padded, so lexicographic order works).
  const timeSlots = [...new Set(sectionRoutines.map(r => `${r.startTime}-${r.endTime}`))].sort();

  // getTeacherName resolves a teacher reference (populated object from the
  // API or raw id) to a display name.
  const getTeacherName = (t) => {
    if (!t) return '-';
    return typeof t === 'object' ? (t.name || '-') : t;
  };

  // forSlot returns the raw entries for a given day + time slot.
  const forSlot = (day, slot) => {
    const [startTime, endTime] = slot.split('-');
    return sectionRoutines.filter(r => r.day === day && r.startTime === startTime && r.endTime === endTime);
  };

  // mergeEntries collapses the entries of one cell into groups keyed by
  // course + type. When two or more teachers share the same course, type,
  // day and time slot (e.g. parallel practical batches or team-taught
  // sessions), they are shown as one block with abbreviations like "AS + BS".
  const mergeEntries = (entries) => {
    const merged = new Map();
    for (const r of entries) {
      const key = `${r.course_code}|${r.type}`;
      if (!merged.has(key)) merged.set(key, []);
      merged.get(key).push(r);
    }
    return [...merged.values()];
  };

  // Teacher abbreviations used in merged cells, collected for the legend.
  // Elective blocks are always included (even a single-option elective)
  // because their teacher codes carry the offered subject name too.
  const usedAbbrevs = new Map();
  for (const slot of timeSlots) {
    for (const day of DAYS) {
      for (const group of mergeEntries(forSlot(day, slot))) {
        if (group.length > 1 || group[0].is_elective) {
          for (const r of group) {
            const name = getTeacherName(r.teacher_id);
            usedAbbrevs.set(getTeacherAbbrev(name), { name, subject: r.subject_name });
          }
        }
      }
    }
  }

  const hasSelection = filter.program && filter.year && filter.part && filter.section;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Section Schedule</h2>
      </div>

      {/* Filter bar: pick a Program -> Year -> Part -> Section -> Group to
          render the weekly timetable. Group is optional — leaving it on
          "All Groups" shows the full section schedule. */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="form-row">
          <div className="form-group">
            <label>Program</label>
            <select className="form-control" value={filter.program} onChange={e => setFilter({ ...INIT_FILTER, program: e.target.value })}>
              <option value="">Select Program</option>
              {programs.map(p => <option key={p.code} value={p.code}>{p.code} — {p.fullName}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Year</label>
            <select className="form-control" value={filter.year} onChange={e => setFilter({ ...filter, year: e.target.value, part: '', section: '' })} disabled={!filter.program}>
              <option value="">Select Year</option>
              {yearOptions.map(y => <option key={y} value={y}>{['I', 'II', 'III', 'IV', 'V'][y - 1] || y}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Part</label>
            <select className="form-control" value={filter.part} onChange={e => setFilter({ ...filter, part: e.target.value, section: '' })} disabled={!filter.year}>
              <option value="">Select Part</option>
              {partOptions.map(p => <option key={p} value={p}>{['I', 'II'][p - 1] || p}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Section</label>
            <select className="form-control" value={filter.section} onChange={e => setFilter({ ...filter, section: e.target.value, group: '' })} disabled={!filter.part}>
              <option value="">Select Section</option>
              {sectionOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Group</label>
            <select className="form-control" value={filter.group} onChange={e => setFilter({ ...filter, group: e.target.value })} disabled={!filter.section}>
              <option value="">All Groups</option>
              {groupOptions.filter(g => g !== '').map(g => <option key={g} value={g}>Group {g}</option>)}
            </select>
          </div>
        </div>
      </div>

      {hasSelection ? (
        <div className="card">
          <div className="card-title">
            {filter.program} — Year {['I', 'II', 'III', 'IV', 'V'][Number(filter.year) - 1] || filter.year}, Part {['I', 'II'][Number(filter.part) - 1] || filter.part} — Section {filter.section}{filter.group ? `, Group ${filter.group}` : ' (All Groups)'}
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ minWidth: 90 }}>Time</th>
                  {DAYS.map(d => <th key={d}>{d}</th>)}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map(slot => (
                  <tr key={slot}>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{slot.replace('-', ' - ')}</td>
                    {DAYS.map(day => {
                      const cells = mergeEntries(forSlot(day, slot));
                      return (
                        <td key={day} style={{ verticalAlign: 'top' }}>
                          {cells.map(entries => {
                            const isElective = entries[0].is_elective;
                            const teachers = entries.map(r => getTeacherName(r.teacher_id));
                            const groups = [...new Set(entries.map(r => r.group).filter(Boolean))];
                            return (
                              <div key={`${entries[0].course_code}-${entries[0].type}`} style={{ marginBottom: cells.length > 1 ? 8 : 0 }}>
                                <div style={{ fontWeight: 600 }}>{entries[0].course_code}</div>
                                {entries[0].subject_id?.title && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{entries[0].subject_id.title}</div>}
                                <div style={{ fontSize: 12, marginTop: 2 }}>
                                  <span className={`badge ${entries[0].type === 'L' ? 'badge-approved' : entries[0].type === 'T' ? 'badge-pending' : 'badge-rejected'}`}>{entries[0].type}</span>
                                  {groups.length > 0 && <span style={{ marginLeft: 6, fontWeight: 600 }}>Grp {groups.join(', ')}</span>}
                                  {!isElective && (
                                    <span style={{ marginLeft: 6 }}>
                                      {entries.length === 1
                                        ? teachers[0]
                                        : teachers.map(getTeacherAbbrev).join(' + ')}
                                    </span>
                                  )}
                                </div>
                                {/* Elective block: one line per offered course,
                                    shown as "NN (A)" — teacher abbreviation
                                    plus the elective subject name. */}
                                {isElective && (
                                  <div style={{ fontSize: 12, marginTop: 2 }}>
                                    {entries.map(r => (
                                      <div key={r._id}>
                                        <strong>{getTeacherAbbrev(getTeacherName(r.teacher_id))}</strong> ({r.subject_name || '?'})
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {cells.length === 0 && <span style={{ color: 'var(--text-secondary)' }}>—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {timeSlots.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 24 }}>No routine entries for this section yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Legend: type meanings plus the teacher abbreviations used in
              merged cells (e.g. "AS" -> "Aman Shakya"). */}
          <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
            <div style={{ marginBottom: usedAbbrevs.size ? 6 : 0 }}>
              Legend: <span className="badge badge-approved">L</span> Lecture, <span className="badge badge-pending">T</span> Tutorial, <span className="badge badge-rejected">P</span> Practical
            </div>
            {usedAbbrevs.size > 0 && (
              <div>
                {[...usedAbbrevs.entries()].map(([abbrev, info]) => (
                  <span key={abbrev} style={{ marginRight: 12 }}>
                    <strong>{abbrev}</strong> = {info.name}{info.subject ? ` (${info.subject})` : ''}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card">
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 24 }}>
            Select a program, year, part and section to view its weekly schedule.
          </div>
        </div>
      )}
    </div>
  );
}
