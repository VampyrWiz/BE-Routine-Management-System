// SectionSchedule — read-only weekly timetable per section (visible to all
// roles, including guests), rendered in the printed-routine format (period
// columns, one row per group) with teacher abbreviations and a PNG export
// via html2canvas.
import { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import api from '../../api/axios';
import { DAYS, fixedSlots, toMin } from '../../utils/routineGrid';

// Class time runs 09:15–16:45 in ten fixed 45-minute periods, mirroring the
// printed routine format (e.g. BCT_III_II_AB.pdf). Periods are the grid
// columns; each day has one row per group letter of the section.
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

// INIT_FILTER drives the cascading Program -> Year -> Part -> Section selects.
// Both groups of the section are always shown, like the printed routine.
const INIT_FILTER = { program: '', year: '', part: '', section: '' };

export default function SectionSchedule() {
  const [routines, setRoutines] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filter, setFilter] = useState(INIT_FILTER);
  // scheduleRef targets the rendered grid (+ legend) for PNG export.
  const scheduleRef = useRef(null);

  useEffect(() => {
    fetchScheduleData();
  }, []);

  // One public request supplies everything this page needs (routines plus
  // the programs/subjects driving the filter cascade). It requires no token,
  // so signed-in guests can view schedules too.
  const fetchScheduleData = async () => {
    try {
      const { data } = await api.get('/routines/public');
      setRoutines(data.routines);
      setPrograms(data.programs);
      setSubjects(data.subjects);
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

  // Sections come from the chosen program's config (e.g. BCT -> ["AB","CD"]).
  // Groups are the letters inside the section name (section "AB" holds
  // groups A and B), and both group rows are always rendered.
  const selectedProgram = programs.find(p => p.code === filter.program);
  const sectionOptions = selectedProgram?.sections || [];
  const groupLetters = (filter.section || 'AB').split('');

  // semesterString rebuilds "Year II: Part I" from the numeric year/part so
  // it can be matched against the semester field stored on each routine.
  const semesterString = (y, p) =>
    (y && p) ? `Year ${toRoman(Number(y))}: Part ${toRoman(Number(p))}` : '';

  // Entries shown in the grid: only the chosen program/year/part/section.
  const sectionRoutines = routines.filter(r =>
    (!filter.program || r.program === filter.program) &&
    (!filter.year || r.semester === semesterString(filter.year, filter.part)) &&
    (!filter.section || r.section === filter.section)
  );

  // getTeacherName resolves a teacher reference (populated object from the
  // API or raw id) to a display name.
  const getTeacherName = (t) => {
    if (!t) return '-';
    return typeof t === 'object' ? (t.name || '-') : t;
  };

  // entryTeachers returns every teacher on an entry: the primary teacher plus
  // any co-teachers stored in additional_teachers (co-taught sessions).
  const entryTeachers = (r) => {
    const primary = r.teacher_id ? [getTeacherName(r.teacher_id)] : [];
    const extras = (r.additional_teachers || [])
      .map(t => getTeacherName(t))
      .filter(n => n && n !== '-');
    return [...primary, ...extras];
  };

  // entryTeacherObjs returns the raw teacher references (populated objects or
  // raw ids) so the designation is available for abbreviation assignment.
  const entryTeacherObjs = (r) => {
    const primary = r.teacher_id ? [r.teacher_id] : [];
    return [...primary, ...(r.additional_teachers || [])];
  };

  // A practical covering the whole section (both groups) stores the section
  // name as its group (e.g. group "AB" in section "AB").
  const isWholeSection = (r) => !r.group || r.group === r.section;

  // Place each entry onto the grid: it is anchored to the first period it
  // covers and colSpan spans its full duration across consecutive periods.
  // Whole-section entries also rowSpan across all group rows of the day,
  // like the merged lectures in the printed routine.
  const placed = [];
  for (const r of sectionRoutines) {
    const start = toMin(r.startTime);
    const end = toMin(r.endTime);
    const first = fixedSlots.findIndex(fs => {
      const [from, to] = fs.split('-').map(toMin);
      return start >= from && start < to;
    });
    if (first < 0) continue; // outside class time
    let span = 1;
    while (first + span < fixedSlots.length && end > toMin(fixedSlots[first + span].split('-')[0])) span++;
    placed.push({ r, day: r.day, period: first, span, whole: isWholeSection(r) });
  }

  // Designation power order, highest first. When two teachers share the same
  // abbreviation (e.g. "San San" and "Sam Sam" both yield "SS"), the more
  // senior designation keeps the plain code and the next gets "SS1", "SS2", …
  // Ties within one designation keep encounter order (first gets the plain
  // code). Unknown designations rank lowest.
  const DESIGNATION_RANK = [
    'professor',
    'associate professor',
    'assistant professor',
    'senior lecturer',
    'lecturer',
    'instructor',
    'teaching assistant',
  ];
  const NORM_DESIG = {
    'prof': 'professor', 'prof.': 'professor', 'professor': 'professor',
    'assoc. prof': 'associate professor', 'assoc. prof.': 'associate professor',
    'associate professor': 'associate professor', 'associate prof.': 'associate professor',
    'asst. prof': 'assistant professor', 'asst. prof.': 'assistant professor',
    'assistant professor': 'assistant professor', 'assistant prof.': 'assistant professor',
    'senior lecturer': 'senior lecturer', 'lecturer': 'lecturer',
    'instructor': 'instructor', 'teaching assistant': 'teaching assistant',
  };
  const designationRank = (d) => {
    const key = (d || '').trim().toLowerCase();
    const norm = NORM_DESIG[key] || key;
    const idx = DESIGNATION_RANK.indexOf(norm);
    return idx === -1 ? DESIGNATION_RANK.length : idx;
  };

  // Teacher abbreviations used in cells, collected with designation + first
  // encounter order so colliding codes can be resolved deterministically.
  const teacherInfo = new Map();
  let order = 0;
  for (const p of placed) {
    for (const t of entryTeacherObjs(p.r)) {
      const name = getTeacherName(t);
      if (!name || name === '-') continue;
      if (!teacherInfo.has(name)) {
        teacherInfo.set(name, {
          designation: typeof t === 'object' ? t.designation : '',
          order: order++,
        });
      }
    }
  }
  // Resolve collisions per base code (e.g. "SS"): sort each group by
  // designation power, then encounter order; the first keeps the plain code,
  // the rest get suffixed numbers.
  const byBase = new Map();
  for (const [name, info] of teacherInfo) {
    const base = getTeacherAbbrev(name);
    if (!byBase.has(base)) byBase.set(base, []);
    byBase.get(base).push({ name, ...info });
  }
  const abbrevByName = new Map();
  for (const [base, group] of byBase) {
    [...group]
      .sort((a, b) => designationRank(a.designation) - designationRank(b.designation) || a.order - b.order)
      .forEach((t, i) => abbrevByName.set(t.name, i === 0 ? base : `${base}${i}`));
  }
  // abbrevOf resolves the final code (with collision suffix) for a teacher.
  const abbrevOf = (name) => abbrevByName.get(name) || getTeacherAbbrev(name);

  const hasSelection = filter.program && filter.year && filter.part && filter.section;

  // handleDownload captures the visible schedule grid as a PNG image. The
  // element's full scroll size is used so an overflowed table is not cut.
  const [exporting, setExporting] = useState(false);
  const handleDownload = async () => {
    if (!scheduleRef.current) return;
    setExporting(true);
    try {
      const el = scheduleRef.current;
      // The wrapper itself is transparent — take the card's themed background
      // so dark-mode exports stay readable.
      const bg = getComputedStyle(el.closest('.card') || el).backgroundColor || '#ffffff';
      // Hug the content while capturing: a full-width block would leave blank
      // margins in the PNG, and width:max-content also stops the scrollable
      // table container from clipping a wide grid. windowWidth makes the
      // render viewport match so the clone lays out identically. Manual
      // width/height overrides are dropped — html2canvas then crops the
      // canvas exactly to the element. A 1cm padding (content-box, since the
      // app sets border-box globally) adds an even margin on all four sides.
      el.style.width = 'max-content';
      el.style.boxSizing = 'content-box';
      el.style.padding = '1cm';
      let canvas;
      try {
        canvas = await html2canvas(el, {
          scale: 2,
          backgroundColor: bg,
          windowWidth: el.offsetWidth,
          useCORS: true,
        });
      } finally {
        el.style.width = '';
        el.style.boxSizing = '';
        el.style.padding = '';
      }
      const link = document.createElement('a');
      link.download = `${filter.program}-Y${filter.year}P${filter.part}-${filter.section}-routine.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error(err);
      alert('Failed to export the schedule as PNG');
    } finally {
      setExporting(false);
    }
  };

  // formatTime drops the leading zero like the printed routine ("09:15" ->
  // "9:15", "13:45" stays).
  const formatTime = (t) => t.replace(/^0/, '');

  // cellBody renders the stacked entries of one grid cell, PDF-style:
  //   Artificial Intelligence [P] Group_A (BJ+TA)
  //   Computer Lab_3
  const cellBody = (entries) => {
    const { span } = entries[0];
    return entries.map(({ r }) => {
      const typeTxt = r.type === 'L' ? '[L]' : r.type === 'T' ? '[T]' : '[P]';
      const title = r.subject_id?.title || r.course_code || '?';
      const electiveName = r.is_elective && r.subject_name ? ` (${r.subject_name})` : '';
      // The group letter inside a cell is only useful when the section has
      // several groups (A/B); with a single group the row itself already
      // denotes it, so nothing is shown. Practicals run by both groups of the
      // section together (group === section) show "A/B" like the printed
      // routine, but only when there is more than one group to show.
      const showGroup = groupLetters.length > 1 && !!r.group;
      const groupTxt = showGroup ? (r.group === r.section ? groupLetters.join('/') : r.group) : '';
      const altWeek = r.week && r.week !== 'every' ? '(Alt.Week)' : '';
      const teachers = entryTeachers(r);
      const teacherTxt = teachers.length ? `(${teachers.map(abbrevOf).join('+')})` : '';
      const roomTxt = r.room ? `@${r.room}` : '';
      return (
        <div key={r._id} style={{ fontSize: 13, lineHeight: 1.35, textAlign: 'center' }}>
          <div style={{ fontWeight: 700 }}>
            {title}{typeTxt}{electiveName}
          </div>
          {(groupTxt || altWeek || teacherTxt || roomTxt) && (
            <div style={{ color: 'var(--text-secondary)' }}>
              {[groupTxt, altWeek, teacherTxt, roomTxt].filter(Boolean).join(' ')}
            </div>
          )}
          {r.note && <div style={{ color: 'var(--text-secondary)' }}>{r.note}</div>}
        </div>
      );
    }).map((node, i, arr) => (
      <div key={i} style={{ marginBottom: i < arr.length - 1 ? 6 : 0, ...(span > 1 ? {} : {}) }}>
        {node}
      </div>
    ));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Section Schedule</h2>
      </div>

      {/* Filter bar: pick a Program -> Year -> Part -> Section to render the
          weekly timetable in the printed routine format (period columns, one
          row per group). */}
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
            <select className="form-control" value={filter.section} onChange={e => setFilter({ ...filter, section: e.target.value })} disabled={!filter.part}>
              <option value="">Select Section</option>
              {sectionOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {hasSelection ? (
        <div className="card">
          {/* scheduleRef captures only the routine itself (title + grid +
              legend) for PNG export; the download button below sits outside
              the captured wrapper so it never appears in the image. */}
          <div ref={scheduleRef}>
            <div className="card-title">
              {filter.program} — Year {['I', 'II', 'III', 'IV', 'V'][Number(filter.year) - 1] || filter.year}, Part {['I', 'II'][Number(filter.part) - 1] || filter.part} — Section {filter.section}
            </div>
            {sectionRoutines.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 24 }}>
                No routine entries for this section yet
              </div>
            ) : (
              <div className="table-container">
              <table className="routine-grid">
                <thead>
                  <tr>
                    <th rowSpan={2} style={{ minWidth: 90 }}>Day / Period</th>
                    <th rowSpan={2}>Group</th>
                    {fixedSlots.map(s => {
                      const [from, to] = s.split('-');
                      return <th key={s} style={{ whiteSpace: 'nowrap' }}>{formatTime(from)} - {formatTime(to)}</th>;
                    })}
                  </tr>
                  <tr>
                    {fixedSlots.map((s, i) => <th key={s}>{i + 1}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map(day => {
                    const dayPlaced = placed.filter(p => p.day === day);
                    // Columns of the day covered by whole-section entries
                    // (rowSpan across all group rows). Periods inside these
                    // ranges must not emit a cell on the rows below, or the
                    // browser pushes them past the covered columns and the
                    // table grows beyond its period columns.
                    const wholeCover = new Set();
                    for (const p of dayPlaced) {
                      if (!p.whole) continue;
                      for (let k = p.period; k < p.period + p.span; k++) wholeCover.add(k);
                    }
                    return groupLetters.map((g, gi) => {
                      // covered collects columns already occupied by a
                      // colSpan cell earlier in this row (whole-section
                      // spans on the first group row included).
                      const covered = new Set(gi > 0 ? wholeCover : []);
                      return (
                      <tr key={`${day}-${g}`}>
                        {gi === 0 && (
                          <td rowSpan={groupLetters.length} className="day-cell">{day}</td>
                        )}
                        <td className="group-cell">{g}</td>
                        {fixedSlots.map((slot, i) => {
                          if (covered.has(i)) return null;
                          // Entries anchored at this period that belong to this
                          // row: whole-section entries live on the first group
                          // row and span the rest via rowSpan.
                          const here = dayPlaced.filter(p =>
                            p.period === i && (p.whole ? gi === 0 : p.r.group === g)
                          );
                          if (!here.length) {
                            // Unallocated run of periods -> one merged BREAK
                            // cell spanning the whole run.
                            let brk = 1;
                            while (i + brk < fixedSlots.length && !covered.has(i + brk)) {
                              const nxt = dayPlaced.filter(p =>
                                p.period === i + brk && (p.whole ? gi === 0 : p.r.group === g)
                              );
                              if (nxt.length) break;
                              covered.add(i + brk);
                              brk++;
                            }
                            return <td key={slot} colSpan={brk} className="break-cell">BREAK</td>;
                          }
                          const { span, whole } = here[0];
                          for (let k = i; k < i + span; k++) covered.add(k);
                          return (
                            <td
                              key={slot}
                              colSpan={span}
                              rowSpan={whole ? groupLetters.length : 1}
                              style={{ verticalAlign: 'top' }}
                            >
                              {cellBody(here)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                    });
                  })}
                </tbody>
              </table>
            </div>
          )}
          {/* Legend: type meanings plus the teacher abbreviations used in the
              cells (e.g. "AS" -> "Aman Shakya"). */}
          <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
            <div style={{ marginBottom: abbrevByName.size ? 6 : 0 }}>
              Legend: <span className="badge badge-approved">L</span> Lecture, <span className="badge badge-pending">T</span> Tutorial, <span className="badge badge-rejected">P</span> Practical
            </div>
            {abbrevByName.size > 0 && (
              <div>
                {[...abbrevByName.entries()].map(([name, abbrev]) => (
                  <span key={name} style={{ marginRight: 12 }}>
                    <strong>{abbrev}</strong> = {name}
                  </span>
                ))}
              </div>
            )}
          </div>
          </div>
          {/* Export button below the routine: rendered outside scheduleRef so
              it never appears in the exported PNG. */}
          {sectionRoutines.length > 0 && (
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <button className="btn btn-primary" onClick={handleDownload} disabled={exporting}>
                {exporting ? 'Exporting…' : '⬇ Download PNG'}
              </button>
            </div>
          )}
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