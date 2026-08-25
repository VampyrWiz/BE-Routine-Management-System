const express = require('express');
const Teacher = require('../models/Teacher');
const Routine = require('../models/Routine');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roles');

const router = express.Router();

// GET /api/teachers — List all teachers across every department.
// Both HoD and DHoD have read access to the full teacher directory;
// create/update/delete below remain HoD-only.
// The -password projection ensures hashed passwords are never exposed.
router.get('/', protect, allowRoles('hod', 'dhod'), async (req, res) => {
  try {
    const teachers = await Teacher.find({}).select('-password');
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/teachers/stats — Weekly teaching load per teacher (HoD/DHoD).
// For every routine entry where the teacher is primary or co-taught
// (additional_teachers), sums the slot duration using the same math as the
// workload check in routines.js, and splits hours into theory (L+T) vs
// practical (P). Counts all entries regardless of approval or odd/even week,
// mirroring assertWorkload so these numbers always match what the workload
// guard enforces. freeHours is max_hours_per_week minus assigned hours.
router.get('/stats', protect, allowRoles('hod', 'dhod'), async (req, res) => {
  try {
    const [teachers, routines] = await Promise.all([
      Teacher.find({}).select('-password').sort({ name: 1 }),
      Routine.find(),
    ]);
    const duration = (r) => {
      const [sh, sm] = r.startTime.split(':').map(Number);
      const [eh, em] = r.endTime.split(':').map(Number);
      return (eh - sh) + (em - sm) / 60;
    };
    const round = (n) => Math.round(n * 100) / 100;
    // Aggregate per teacher id; teachers with no routines fall back to zeros.
    const stats = new Map();
    const add = (id, r) => {
      const key = String(id);
      if (!key) return;
      const s = stats.get(key) || { classes: 0, totalHours: 0, theoryHours: 0, labHours: 0 };
      const h = duration(r);
      s.classes += 1;
      s.totalHours += h;
      if (r.type === 'P') s.labHours += h; else s.theoryHours += h;
      stats.set(key, s);
    };
    for (const r of routines) {
      add(r.teacher_id, r);
      for (const id of r.additional_teachers || []) add(id, r);
    }
    const empty = { classes: 0, totalHours: 0, theoryHours: 0, labHours: 0 };
    res.json(teachers.map(t => {
      const s = stats.get(String(t._id)) || empty;
      return {
        _id: t._id,
        name: t.name,
        email: t.email,
        designation: t.designation,
        department_code: t.department_code,
        role: t.role,
        max_hours_per_week: t.max_hours_per_week,
        classes: s.classes,
        totalHours: round(s.totalHours),
        theoryHours: round(s.theoryHours),
        labHours: round(s.labHours),
        freeHours: round(t.max_hours_per_week - s.totalHours),
      };
    }));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/teachers — Create a new teacher (HoD only).
// If no password is provided, one is auto-generated from the teacher's first
// name + "123" (e.g. "Aman Shakya" → "aman123") so the teacher receives a
// predictable default credential they can change via the profile page later.
// Common honorifics (Dr, Prof, etc.) are stripped so "Dr Aman Shakya" still
// yields "aman123" rather than "dr123".
router.post('/', protect, allowRoles('hod'), async (req, res) => {
  try {
    if (!req.body.password && req.body.name) {
      const parts = req.body.name.trim().split(/\s+/);
      const first = parts.find(w => !/^(dr|prof|mr|mrs|ms|er|engr)\.?$/i.test(w)) || parts[0];
      req.body.password = first.toLowerCase() + '123';
    }
    const teacher = await Teacher.create(req.body);
    res.status(201).json(teacher);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/teachers/:id — Update a teacher (HoD only).
router.put('/:id', protect, allowRoles('hod'), async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    res.json(teacher);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/teachers/:id — Remove a teacher (HoD only).
router.delete('/:id', protect, allowRoles('hod'), async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndDelete(req.params.id);
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    res.json({ message: 'Teacher deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
