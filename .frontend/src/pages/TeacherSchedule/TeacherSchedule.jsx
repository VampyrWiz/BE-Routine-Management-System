// TeacherSchedule — the per-teacher weekly timetable, rendered in the same
// printed-routine format as the Section Schedule (period columns, one row
// per day). Available to every role; shows only the signed-in user's own
// routine entries (the primary teacher of each entry).
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { DAYS, fixedSlots, toMin, formatTime } from '../../utils/routineGrid';
import downloadElementPng from '../../utils/download';

export default function TeacherSchedule() {
  const { teacher } = useAuth();
  const [routines, setRoutines] = useState([]);
  // scheduleRef targets the grid (+ legend) for PNG export.
  const scheduleRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  // handleDownload exports the weekly timetable via the shared PNG helper —
  // hug-to-content with a 1cm margin on all sides.
  const handleDownload = async () => {
    if (!scheduleRef.current) return;
    setExporting(true);
    try {
      await downloadElementPng(scheduleRef.current, `${teacher?.name || 'teacher'}-schedule.png`);
    } catch (err) {
      console.error(err);
      alert('Failed to export the schedule as PNG');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchRoutines();
  }, []);

  const fetchRoutines = async () => {
    try {
      const { data } = await api.get('/routines');
      setRoutines(data);
    } catch (err) {
      console.error(err);
    }
  };

  // myRoutines: only entries where the signed-in user is the primary teacher.
  // teacher_id can be a populated object or a raw ID string, so handle both.
  const myRoutines = routines.filter(r => {
    const tid = typeof r.teacher_id === 'object' ? r.teacher_id?._id : r.teacher_id;
    return tid === teacher?._id;
  });

  // Place each entry onto the grid: anchored at the first period it covers
  // and colSpan spanning its full duration across consecutive periods.
  const placed = [];
  for (const r of myRoutines) {
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
      const groupTxt = r.group === r.section ? 'Both' : (r.group ? `Group ${r.group}` : '');
      const weekTxt = r.week && r.week !== 'every' ? `(${r.week === 'odd' ? 'Odd weeks' : 'Even weeks'})` : '';
      const roomTxt = r.room ? `@${r.room}` : '';
      // Secondary line: group / alternate-week marker / room.
      const meta = [groupTxt, weekTxt].filter(Boolean).join(' · ');
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

  return (
    <div>
      <h2>Teacher Schedule</h2>

      {myRoutines.length === 0 ? (
        <div className="card">
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 24 }}>
            No routine entries assigned to you yet.
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
                          return <td key={slot} colSpan={brk} className="break-cell">BREAK</td>;
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
