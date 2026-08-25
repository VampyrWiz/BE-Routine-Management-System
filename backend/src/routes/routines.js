const express = require('express');
const mongoose = require('mongoose');
const Routine = require('../models/Routine');
const Subject = require('../models/Subject');
const Program = require('../models/Program');
const Teacher = require('../models/Teacher');
const { protect } = require('../middleware/auth');
const { allowRoles, hodOnly } = require('../middleware/roles');

const router = express.Router();

// resolveSubject looks up the Subject referenced by subject_id and derives
// course_code, semester and program from the curriculum document, so users
// never type codes manually. If a program is supplied in the payload it is
// validated against the subject's program list (a subject can be shared
// across programs via its comma-separated program field).
// A subject whose code or title mentions "Elective" is marked is_elective so
// the handlers know the entry represents an elective block that may run as
// multiple parallel options taught by different teachers.
const resolveSubject = async (data) => {
  if (!data.subject_id) return data;
  const subject = await Subject.findById(data.subject_id);
  if (!subject) throw Object.assign(new Error('Subject not found'), { status: 400 });
  if (data.program) {
    const offeredIn = (subject.program || '').split(',').map(s => s.trim().toUpperCase());
    if (!offeredIn.includes(data.program.trim().toUpperCase())) {
      throw Object.assign(new Error(`Subject ${subject.code} is not offered in ${data.program}`), { status: 400 });
    }
  }
  data.course_code = subject.code;
  data.semester = subject.semester;
  if (!data.program) data.program = subject.program ? subject.program.split(',')[0].trim() : '';
  data.is_elective = /elective/i.test(`${subject.code} ${subject.title}`);
  return data;
};

// computeHours returns the duration of a time slot in hours (e.g. "09:00"-
// "10:30" -> 1.5). Used by the workload check for both regular and elective
// entries.
const computeHours = (startTime, endTime) => {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  return (eh - sh) + (em - sm) / 60;
};

// assertWorkload rejects a schedule change if it would push a regular teacher
// past max_hours_per_week. HoDs/DHoDs are never workload-limited because their
// approval implies the schedule is acceptable.
const assertWorkload = async (teacher, newHours) => {
  if (teacher.role !== 'teacher') return;
  const existingRoutines = await Routine.find({ teacher_id: teacher._id });
  const totalHours = existingRoutines.reduce((sum, r) => sum + computeHours(r.startTime, r.endTime), 0);
  if ((totalHours + newHours) > teacher.max_hours_per_week) {
    const err = new Error(`Teacher ${teacher.name} would exceed ${teacher.max_hours_per_week}h/week. Need HoD approval.`);
    err.requiresApproval = true;
    err.currentHours = totalHours;
    err.newHours = newHours;
    err.maxHours = teacher.max_hours_per_week;
    throw err;
  }
};

// GET /api/routines/public — no auth. Read-only bundle for the Section
// Schedule page so guests (no token) can view timetables: every routine
// entry plus the programs/subjects its Program -> Year -> Part -> Section
// filter cascade needs. Write access still requires HoD/DHoD below.
router.get('/public', async (req, res) => {
  try {
    const [routines, programs, subjects] = await Promise.all([
      Routine.find()
        .populate('teacher_id', 'name email designation')
        .populate('additional_teachers', 'name email designation')
        .populate('subject_id', 'code title semester program'),
      Program.find().sort({ code: 1 }),
      Subject.find(),
    ]);
    res.json({ routines, programs, subjects });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/routines — List routines with role-based filtering.
// Teachers can only see their own routines (filter by teacher_id, including
// co-taught sessions via additional_teachers).
// DHoDs can only see routines for their department.
// Additional query parameters (semester, department, teacher_id) allow
// further narrowing. populate is used to resolve teacher_id into
// name, email, and designation so the frontend can display teacher info
// without a second request.
router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.teacher.role === 'teacher') {
      filter.$or = [
        { teacher_id: req.teacher._id },
        { additional_teachers: req.teacher._id },
      ];
    }
    if (req.teacher.role === 'dhod') {
      filter.department = req.teacher.department_code;
    }
    if (req.query.semester) filter.semester = req.query.semester;
    if (req.query.department) filter.department = req.query.department;
    if (req.query.teacher_id) filter.teacher_id = req.query.teacher_id;
    const routines = await Routine.find(filter)
      .populate('teacher_id', 'name email designation')
      .populate('additional_teachers', 'name email designation')
      .populate('subject_id', 'code title semester program');
    res.json(routines);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// resolveTeachers loads every teacher referenced by a payload (the primary
// teacher plus any additional_teachers) and fails fast if any id is unknown.
// Returns an array of Teacher documents with the primary teacher first.
const resolveTeachers = async (primaryId, additionalIds) => {
  const ids = [primaryId, ...(Array.isArray(additionalIds) ? additionalIds : [])]
    .map(id => String(id))
    .filter(Boolean);
  const seen = new Set();
  const teachers = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    const t = await Teacher.findById(id);
    if (!t) throw Object.assign(new Error('Teacher not found'), { status: 404 });
    teachers.push(t);
  }
  return teachers;
};

// POST /api/routines — Create a routine entry (DHoD only).
// Before saving, the handler calculates the teacher's total scheduled hours
// by summing (endTime - startTime) across all existing routines for that teacher.
// It also calculates the hours for the new entry being created.
// If adding the new hours would exceed the teacher's max_hours_per_week,
// and the teacher's role is 'teacher' (not HoD/DHoD), the request is rejected
// with requiresApproval: true, telling the frontend that an approval request
// must be submitted first. Every entry starts as isApproved: false — the
// DHoD drafts the routine and the HoD approves it via the approve endpoint.
// For elective courses the payload may carry electiveOptions (array of
// { subject_name, teacher_id }) — one entry is created per option, all sharing
// the same elective_group id so the block of parallel electives stays linked.
// The workload check runs against every teacher listed in the options.
router.post('/', protect, allowRoles('dhod'), async (req, res) => {
  try {
    const routineData = await resolveSubject({ ...req.body });
    const newHours = computeHours(routineData.startTime, routineData.endTime);

    // Elective block: a single time slot running several elective courses in
    // parallel, each taught by its own teacher. Reject if the block would push
    // any of those teachers past their weekly limit.
    if (routineData.is_elective && Array.isArray(req.body.electiveOptions) && req.body.electiveOptions.length) {
      const options = req.body.electiveOptions.filter(o => o.subject_name && o.teacher_id);
      if (!options.length) {
        return res.status(400).json({ message: 'Add at least one elective option with a subject name and teacher' });
      }
      for (const opt of options) {
        const teacher = await Teacher.findById(opt.teacher_id);
        if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
        try {
          await assertWorkload(teacher, newHours);
        } catch (err) {
          if (err.requiresApproval) {
            return res.status(400).json({
              message: err.message,
              requiresApproval: true,
              currentHours: err.currentHours,
              newHours,
              maxHours: teacher.max_hours_per_week,
            });
          }
          throw err;
        }
      }
      const group = new mongoose.Types.ObjectId().toString();
      const created = [];
      for (const opt of options) {
        const teacher = await Teacher.findById(opt.teacher_id);
        created.push(await Routine.create({
          ...routineData,
          subject_name: opt.subject_name,
          teacher_id: opt.teacher_id,
          elective_group: group,
          is_elective: true,
          additional_teachers: [],
          department: routineData.department || teacher.department_code,
          isApproved: false,
        }));
      }
      return res.status(201).json(created);
    }

    // Regular entry — possibly co-taught by several teachers.
    const teachers = await resolveTeachers(routineData.teacher_id, req.body.additional_teachers);
    for (const teacher of teachers) {
      try {
        await assertWorkload(teacher, newHours);
      } catch (err) {
        if (err.requiresApproval) {
          return res.status(400).json({
            message: err.message,
            requiresApproval: true,
            currentHours: err.currentHours,
            newHours,
            maxHours: teacher.max_hours_per_week,
          });
        }
        throw err;
      }
    }

    const primary = teachers[0];
    const routine = await Routine.create({
      ...routineData,
      // The department is taken from the teacher's own department so the
      // DHoD-level routine filtering works without the client supplying it.
      department: routineData.department || primary.department_code,
      // additional_teachers excludes the primary teacher and keeps the order
      // submitted (deduped by resolveTeachers).
      additional_teachers: teachers.slice(1).map(t => t._id),
      isApproved: false,
    });
    res.status(201).json(routine);
  } catch (err) {
    res.status(err.status || 400).json({ message: err.message });
  }
});

// PUT /api/routines/:id — Update a routine entry (DHoD only).
// Subject-derived fields (course_code, semester, program) are re-resolved
// whenever subject_id is included in the payload.
// Any edit resets isApproved to false so the HoD re-reviews changed entries.
// Editing an elective entry regenerates the whole elective block: every
// option in the shared elective_group is replaced with the submitted
// electiveOptions so day/time/section/options never drift out of sync.
router.put('/:id', protect, allowRoles('dhod'), async (req, res) => {
  try {
    const existing = await Routine.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Routine not found' });

    const routineData = await resolveSubject({ ...req.body });

    if (routineData.is_elective && Array.isArray(req.body.electiveOptions) && req.body.electiveOptions.length) {
      const options = req.body.electiveOptions.filter(o => o.subject_name && o.teacher_id);
      if (!options.length) {
        return res.status(400).json({ message: 'Add at least one elective option with a subject name and teacher' });
      }
      const group = existing.elective_group || new mongoose.Types.ObjectId().toString();
      await Routine.deleteMany({ elective_group: group });
      const updated = [];
      for (const opt of options) {
        const teacher = await Teacher.findById(opt.teacher_id);
        if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
        updated.push(await Routine.create({
          ...routineData,
          subject_name: opt.subject_name,
          teacher_id: opt.teacher_id,
          elective_group: group,
          is_elective: true,
          additional_teachers: [],
          department: routineData.department || teacher.department_code,
          isApproved: false,
        }));
      }
      return res.json(updated);
    }

    // Co-taught entries: validate every teacher and store the deduplicated
    // list without the primary teacher.
    const teachers = await resolveTeachers(routineData.teacher_id, req.body.additional_teachers);
    routineData.additional_teachers = teachers.slice(1).map(t => t._id);
    // Any edit goes back to Pending so the HoD re-approves the changed entry.
    routineData.isApproved = false;

    const routine = await Routine.findByIdAndUpdate(req.params.id, routineData, { new: true })
      .populate('teacher_id', 'name email designation')
      .populate('additional_teachers', 'name email designation')
      .populate('subject_id', 'code title semester program');
    if (!routine) return res.status(404).json({ message: 'Routine not found' });
    res.json(routine);
  } catch (err) {
    res.status(err.status || 400).json({ message: err.message });
  }
});

// DELETE /api/routines/:id — Delete a routine entry (DHoD only).
router.delete('/:id', protect, allowRoles('dhod'), async (req, res) => {
  try {
    await Routine.findByIdAndDelete(req.params.id);
    res.json({ message: 'Routine entry deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/routines/:id/approve — Explicitly approve a routine (HoD only).
// Sets isApproved to true regardless of the previous value.
// This is the HoD's side of the workflow: the DHoD creates and edits routine
// entries (always isApproved: false), and the HoD reviews and approves them here.
router.put('/:id/approve', protect, hodOnly, async (req, res) => {
  try {
    const routine = await Routine.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    if (!routine) return res.status(404).json({ message: 'Routine not found' });
    res.json(routine);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
