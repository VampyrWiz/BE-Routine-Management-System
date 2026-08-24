// RoomSchedule — weekly timetable for a single room, in the same
// printed-routine format as the Section/Teacher schedules. Visible to every
// role including guests: data comes from the public /routines/public
// endpoint, and the room list is derived from the routine entries themselves.
import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { DAYS, fixedSlots, toMin, formatTime } from '../../utils/routineGrid';
import downloadElementPng from '../../utils/download';

// tName resolves a populated teacher object (or raw id) to a display name.
const tName = (t) => (typeof t === 'object' ? t?.name : t) || '';

export default function RoomSchedule() {
  const [routines, setRoutines] = useState([]);
  const [room, setRoom] = useState('');
  // scheduleRef targets the grid (+ legend) for PNG export.
  const scheduleRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchRoutines();
  }, []);

  const fetchRoutines = async () => {
    try {
      const { data } = await api.get('/routines/public');
      setRoutines(data.routines);
    } catch (err) {
      console.error(err);
    }
  };

  // Every room that has at least one routine entry, alphabetically.
  const rooms = [...new Set(routines.map(r => r.room).filter(Boolean))].sort();

  // handleDownload exports the timetable via the shared PNG helper —
  // hug-to-content with a 1cm margin on all sides.
  const handleDownload = async () => {
    if (!scheduleRef.current) return;
    setExporting(true);
    try {
      await downloadElementPng(scheduleRef.current, `${room}-schedule.png`);
    } catch (err) {
      console.error(err);
      alert('Failed to export the schedule as PNG');
    } finally {
      setExporting(false);
    }
  };

  // Entries booked into the selected room.
  const roomRoutines = routines.filter(r => r.room === room);

  // Place each entry onto the grid: anchored at the first period it covers
  // and colSpan spanning its full duration across consecutive periods.
  const placed = [];
  for (const r of roomRoutines) {
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

  // cellBody renders one grid cell: course [type], which class is using the
  // room (section/group) and the teacher running it.
  const cellBody = (entries) => {
    return entries.map(({ r }) => {
      const typeTxt = r.type === 'L' ? '[L]' : r.type === 'T' ? '[T]' : '[P]';
      const title = r.subject_id?.title || r.course_code || '?';
      const where = [
        r.section && `Sec ${r.section}`,
        r.group && r.group !== r.section && `Group ${r.group}`,
      ].filter(Boolean).join(' ');
      const who = tName(r.teacher_id);
      const meta = [where, who].filter(Boolean).join(' · ');
      return (
        <div key={r._id} style={{ fontSize: 13, lineHeight: 1.35, textAlign: 'center' }}>
          <div style={{ fontWeight: 600 }}>{title} {typeTxt}</div>
          {meta && <div style={{ color: 'var(--text-secondary)' }}>{meta}</div>}
          {r.note && <div style={{ color: 'var(--text-secondary)' }}>{r.note}</div>}
        </div>
      );
    });
  };

  return (
    <div>
      <h2>Room Schedule</h2>

      {/* Filter bar: pick the room to view its weekly timetable. */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="form-row">
          <div className="form-group">
            <label>Room</label>
            <select className="form-control" value={room} onChange={e => setRoom(e.target.value)}>
              <option value="">Select Room</option>
              {rooms.map(rm => <option key={rm} value={rm}>{rm}</option>)}
            </select>
          </div>
        </div>
      </div>

      {!room ? (
        <div className="card">
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 24 }}>
            Select a room to view its weekly schedule.
          </div>
        </div>
      ) : (
        <div className="card">
          {/* scheduleRef captures only the routine itself (grid + legend);
              the download button below sits outside the captured wrapper. */}
          <div ref={scheduleRef}>
            <div className="card-title">Room {room} — Weekly Routine</div>
            {roomRoutines.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 24 }}>
                No routine entries for this room yet
              </div>
            ) : (
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
                              // Unallocated run of periods -> one merged FREE
                              // cell spanning the whole run.
                              let brk = 1;
                              while (i + brk < fixedSlots.length && !dayPlaced.some(p => p.period === i + brk)) brk++;
                              for (let k = i; k < i + brk; k++) covered.add(k);
                              return <td key={slot} colSpan={brk} className="break-cell">FREE</td>;
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
            )}
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
