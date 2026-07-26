const mongoose = require('mongoose');

// Routine schema — represents a single time-slot assignment for a teacher.
// day is an enum restricted to the seven days of the week so that invalid
// values are rejected at the database level.
// teacher_id references Teacher (ObjectId + ref) so that populate() can
// resolve teacher name/email/designation in a single query.
// type distinguishes Lecture / Tutorial / Practical so the system can
// compute hour totals per category when enforcing workload limits.
// isApproved defaults to false; it is set to true only when the routine
// is created by a HoD or explicitly approved via the approve endpoint.
// The department field replicates the teacher's department so that
// DHoD-level queries can filter routines without a join.
const routineSchema = new mongoose.Schema({
  day: { type: String, enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  course_code: { type: String, required: true },
  teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  section: { type: String, default: 'A' },
  room: { type: String, default: '' },
  type: { type: String, enum: ['L', 'T', 'P'], default: 'L' },
  semester: { type: String, required: true },
  department: { type: String, required: true },
  isApproved: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Routine', routineSchema);
