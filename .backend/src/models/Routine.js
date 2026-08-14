const mongoose = require('mongoose');

// Routine schema — represents a single time-slot assignment for a teacher.
// day is an enum restricted to Monday–Friday (the teaching week).
// subject_id references Subject (ObjectId + ref) so the course code, semester
// and program can be derived from the curriculum instead of typed manually.
// course_code and semester are still stored denormalized so that old entries
// and non-subject-linked routines keep working without a join.
// program stores the program code (e.g. "BCT", "BEX") the routine belongs to,
// which is used to scope course and teacher selection in the UI.
// teacher_id references Teacher (ObjectId + ref) so that populate() can
// resolve teacher name/email/designation in a single query. A session can be
// co-taught: additional_teachers lists any extra faculty for the same subject
// and slot (e.g. team-teaching or shared practical supervision).
// note is a free-text optional remark (e.g. "Both sections together", "Lab
// room 203") shown alongside the entry wherever the routine is displayed.
// week marks alternate-week practicals: 'every' (default) runs weekly, while
// 'odd' / 'even' mean the entry only runs on odd or even numbered weeks —
// two entries sharing a slot but with different week values alternate.
// type distinguishes Lecture / Tutorial / Practical so the system can
// compute hour totals per category when enforcing workload limits.
// isApproved defaults to false; it is set to true only when the routine
// is created by a HoD or explicitly approved via the approve endpoint.
// The department field replicates the teacher's department so that
// DHoD-level queries can filter routines without a join.
// Elective support: an elective course (title or code contains "Elective")
// is offered as multiple parallel options in the same time slot, each taught
// by a different teacher. When that happens one Routine document is created
// per option with is_elective: true, subject_name holding the actual elective
// title (e.g. "A", "Computational Intelligence"), and elective_group linking
// every option of the same block so they can be updated together.
const routineSchema = new mongoose.Schema({
  day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  course_code: { type: String, required: true },
  subject_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null },
  program: { type: String, default: '' },
  teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  section: { type: String, default: '' },
  // group is the batch letter inside a section (e.g. "A" within section "AB").
  // Section names are letter pairs, so the group letters always come from
  // the section name itself. A practical covering the whole section stores
  // the section name as the group (group === section means "both groups").
  group: { type: String, default: '' },
  type: { type: String, enum: ['L', 'T', 'P'], default: 'L' },
  semester: { type: String, required: true },
  department: { type: String, required: true },
  isApproved: { type: Boolean, default: false },
  is_elective: { type: Boolean, default: false },
  subject_name: { type: String, default: '' },
  elective_group: { type: String, default: '' },
  additional_teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }],
  note: { type: String, default: '' },
  week: { type: String, enum: ['every', 'odd', 'even'], default: 'every' },
}, { timestamps: true });

module.exports = mongoose.model('Routine', routineSchema);
