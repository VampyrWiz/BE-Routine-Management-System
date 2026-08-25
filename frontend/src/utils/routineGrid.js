// Shared weekly-timetable constants/helpers used by both the per-section
// schedule (SectionSchedule) and the per-teacher schedule (TeacherSchedule).
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const fmtMin = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

export const CLASS_START = 9 * 60 + 15;  // 09:15
export const CLASS_END = 16 * 60 + 45;   // 16:45
export const SLOT_MINUTES = 45;

// Ten fixed 45-minute periods mirroring the printed routine format.
export const fixedSlots = [];
for (let m = CLASS_START; m < CLASS_END; m += SLOT_MINUTES) {
  fixedSlots.push(`${fmtMin(m)}-${fmtMin(Math.min(m + SLOT_MINUTES, CLASS_END))}`);
}

export const toMin = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

// formatTime drops the leading zero like the printed routine (e.g. "09:15" -> "9:15").
export const formatTime = (t) => t.replace(/^0/, '');