// TeacherSchedule — the per-teacher weekly timetable, rendered in the same
// printed-routine format as the Section Schedule (period columns, one row
// per day). Available to every role; shows only the signed-in user's own
// routine entries (the primary teacher of each entry), except hod/dhod who
// can pick any teacher from the directory and view that teacher's week.
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { DAYS, fixedSlots, toMin, formatTime } from '../../utils/routineGrid';
import downloadElementPng from '../../utils/download';

export default function TeacherSchedule() {
  const { teacher } = useAuth();
  const [routines, setRoutines] = useState([]);
  // hod/dhod can browse any teacher's timetable: teachers holds the
  // directory for the picker, viewId is 'me' or a Teacher _id.
  const canViewAll = teacher?.role === 'hod' || teacher?.role === 'dhod';
  const [teachers, setTeachers] = useState([]);
  const [viewId, setViewId] = useState('me');
  // scheduleRef targets the grid (+ legend) for PNG export.
  const scheduleRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  // handleDownload exports the weekly timetable via the shared PNG helper —
  // hug-to-content with a 1cm margin on all sides.
  const handleDownload = async () => {
    if (!scheduleRef.current) return;
    setExporting(true);
    try {
      const viewed = viewId === 'me' ? teacher : teachers.find(t => t._id === viewId);
      await downloadElementPng(scheduleRef.current, `${viewed?.name || 'teacher'}-schedule.png`);
    } catch (err) {
      console.error(err);
      alert('Failed to export the schedule as PNG');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchRoutines();
    if (canViewAll) {
      api.get('/teachers').then(({ data }) => setTeachers(data)).catch(() => {});
    }
  }, []);

  const fetchRoutines = async () => {
    try {
      const { data } = await api.get('/routines');
      setRoutines(data);
    } catch (err) {
      console.error(err);
    }
  };

  // displayedRoutines (myRoutines): every entry the viewed teacher teaches —
  // as primary or co-teacher (additional_teachers). 'me' resolves to the
  // signed-in user; hod/dhod may target any teacher from the picker.
  // References can be populated objects or raw ID strings, so handle both.
  const isTarget = (t) => (typeof t === 'object' ? t?._id : t) === String(viewId === 'me' ? teacher?._id : viewId);
  const myRoutines = routines.filter(
    r => isTarget(r.teacher_id) || (r.additional_teachers || []).some(isTarget)
  );

  // An elective entry: a UI-created elective block (is_elective flag) or an
  // older row whose course is named "Elective …".
  const isElective = (r) =>
    !!r.is_elective || /elective/i.test(`${r.subject_id?.title || ''} ${r.course_code || ''} ${r.subject_name || ''}`);

  // Electives are booked once per section, and a teacher can hold the same
  // course for several sections in partially overlapping windows (e.g. AB
  // 14:30-16:45 plus CD 16:00-16:45). Each day+course group is cut into time
  // segments between block boundaries, recording which sections attend each;
  // adjacent segments with identical attendance fuse back into one grid
  // entry. Cells then read "Sec AB" … "Sec AB + CD" across the slots.
  const mergedRoutines = [];
  const electiveGroups = new Map();
  for (const r of myRoutines) {
    if (!isElective(r)) {
      mergedRoutines.push(r);
      continue;
    }
    const key = `${r.day}|${r.subject_id?.title || r.course_code || ''}`;
    if (!electiveGroups.has(key)) electiveGroups.set(key, []);
    electiveGroups.get(key).push(r);
  }
  for (const entries of electiveGroups.values()) {
    const bounds = [...new Set(entries.flatMap(e => [e.startTime, e.endTime]))]
      .sort((a, b) => toMin(a) - toMin(b));
    const segs = [];
    for (let i = 0; i < bounds.length - 1; i++) {
      const from = toMin(bounds[i]);
      const to = toMin(bounds[i + 1]);
      const sections = [...new Set(
        entries
          .filter(en => toMin(en.startTime) <= from && toMin(en.endTime) >= to)
          .map(en => en.section)
      )].filter(Boolean);
      if (!sections.length) continue;
      const prev = segs[segs.length - 1];
      if (prev && prev.sections.join('|') === sections.join('|')) {
        prev.endTime = bounds[i + 1];
      } else {
        segs.push({ startTime: bounds[i], endTime: bounds[i + 1], sections });
      }
    }
    segs.forEach((sg, i) => mergedRoutines.push({
      ...entries[0],
      _id: `${entries[0]._id}#${i}`, // synthetic ids keep React keys unique
      ...sg,
    }));
  }

  // Place each entry onto the grid: anchored at the first period it covers
  // and colSpan spanning its full duration across consecutive periods.
  const placed = [];
  for (const r of mergedRoutines) {
    const start = toMin(r.startTime);
    const end = toMin(r.endTime);
    const first = fixedSlots.findIndex(fs => {
      const [from, to] = fs.split('-').map(toMin);
      return start >= from && start < to;
    });
    if (first < 0) continue; // outside class time
    let span = 1;
    while (first + span < fixedSlots.length && end > toMin(fixedSlots[first + span].split('-')[0])) span++;
    placed.push({ r, day: r.day, period: first, span });
  }

  // cellBody renders one grid cell, PDF-style:
  //   Artificial Intelligence [P] · Group_A (Odd weeks)
  const cellBody = (entries) => {
    return entries.map(({ r }) => {
      const typeTxt = r.type === 'L' ? '[L]' : r.type === 'T' ? '[T]' : '[P]';
      const title = r.subject_id?.title || r.course_code || '?';
      // Electives show which sections attend (merged duplicates read
      // "AB + CD"); regular entries keep the group marker only.
      const secTxt = isElective(r)
        ? [...new Set(r.sections || [r.section])].filter(Boolean).join(' + ')
        : '';
      const groupTxt = secTxt ? '' : (r.group === r.section ? 'Both' : (r.group ? `Group ${r.group}` : ''));
      const weekTxt = r.week && r.week !== 'every' ? `(${r.week === 'odd' ? 'Odd weeks' : 'Even weeks'})` : '';
      const roomTxt = r.room ? `@${r.room}` : '';
      // Secondary line: section / group / alternate-week marker / room.
      const meta = [secTxt && `Sec ${secTxt}`, groupTxt, weekTxt].filter(Boolean).join(' · ');
      return (
        <div key={r._id} style={{ fontSize: 13, lineHeight: 1.35, textAlign: 'center' }}>
          <div style={{ fontWeight: 600 }}>{title} {typeTxt}</div>
          {(meta || roomTxt) && (
            <div style={{ color: 'var(--text-secondary)' }}>
              {meta}{meta && roomTxt ? ' ' : ''}{roomTxt}
            </div>
          )}
          {r.note && <div style={{ color: 'var(--text-secondary)' }}>{r.note}</div>}
        </div>
      );
    });
  };

  const viewedName = viewId === 'me' ? 'you' : teachers.find(t => t._id === viewId)?.name || 'selected teacher';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h2>Teacher Schedule</h2>
        {canViewAll && teachers.length > 0 && (
          <select className="form-control" style={{ maxWidth: 260 }} value={viewId} onChange={e => setViewId(e.target.value)}>
            <option value="me">My schedule</option>
            {teachers.filter(t => t._id !== teacher?._id).map(t => (
              <option key={t._id} value={t._id}>{t.name} ({t.department_code})</option>
            ))}
          </select>
        )}
      </div>

      {myRoutines.length === 0 ? (
        <div className="card">
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 24 }}>
            No routine entries assigned to {viewedName} yet.
          </div>
        </div>
      ) : (
        <div className="card">
          {/* scheduleRef captures only the routine itself (grid + legend);
              the download button below sits outside the captured wrapper. */}
          <div ref={scheduleRef}>
            <div className="table-container">
            <table className="routine-grid">
              <thead>
                <tr>
                  <th rowSpan={2} style={{ minWidth: 90 }}>Day / Period</th>
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
                  const covered = new Set();
                  return (
                    <tr key={day}>
                      <td className="day-cell">{day}</td>
                      {fixedSlots.map((slot, i) => {
                        if (covered.has(i)) return null;
                        const here = dayPlaced.filter(p => p.period === i);
                        if (!here.length) {
                          // Unallocated run of periods -> one merged BREAK
                          // cell spanning the whole run.
                          let brk = 1;
                          while (i + brk < fixedSlots.length && !dayPlaced.some(p => p.period === i + brk)) brk++;
                          for (let k = i; k < i + brk; k++) covered.add(k);
                          return <td key={slot} colSpan={brk} className="break-cell" />;
                        }
                        const span = here[0].span;
                        for (let k = i; k < i + span; k++) covered.add(k);
                        return (
                          <td key={slot} colSpan={span}>
                            {cellBody(here)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Legend: type meanings */}
          <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
            Legend: <span className="badge badge-approved">L</span> Lecture,{' '}
            <span className="badge badge-pending">T</span> Tutorial,{' '}
            <span className="badge badge-rejected">P</span> Practical
          </div>
          </div>
          {/* Download button below the routine: rendered outside scheduleRef
              so it never appears in the exported PNG. */}
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <button className="btn btn-primary" onClick={handleDownload} disabled={exporting}>
              {exporting ? 'Exporting…' : '⬇ Download PNG'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
