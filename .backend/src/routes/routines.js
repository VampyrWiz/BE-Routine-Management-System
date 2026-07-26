const express = require('express');
const Routine = require('../models/Routine');
const Teacher = require('../models/Teacher');
const { protect } = require('../middleware/auth');
const { allowRoles, hodOnly } = require('../middleware/roles');

const router = express.Router();

// GET /api/routines — List routines with role-based filtering.
// Teachers can only see their own routines (filter by teacher_id).
// DHoDs can only see routines for their department.
// Additional query parameters (semester, department, teacher_id) allow
// further narrowing. populate is used to resolve teacher_id into
// name, email, and designation so the frontend can display teacher info
// without a second request.
router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.teacher.role === 'teacher') {
      filter.teacher_id = req.teacher._id;
    }
    if (req.teacher.role === 'dhod') {
      filter.department = req.teacher.department_code;
    }
    if (req.query.semester) filter.semester = req.query.semester;
    if (req.query.department) filter.department = req.query.department;
    if (req.query.teacher_id) filter.teacher_id = req.query.teacher_id;
    const routines = await Routine.find(filter).populate('teacher_id', 'name email designation');
    res.json(routines);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/routines — Create a routine entry (HoD or DHoD only).
// Before saving, the handler calculates the teacher's total scheduled hours
// by summing (endTime - startTime) across all existing routines for that teacher.
// It also calculates the hours for the new entry being created.
// If adding the new hours would exceed the teacher's max_hours_per_week,
// and the teacher's role is 'teacher' (not HoD/DHoD), the request is rejected
// with requiresApproval: true, telling the frontend that an approval request
// must be submitted first. If the creator is a HoD, isApproved is set to true
// automatically because the HoD's action implies approval.
router.post('/', protect, allowRoles('hod', 'dhod'), async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.body.teacher_id);
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

    const existingRoutines = await Routine.find({ teacher_id: req.body.teacher_id });
    const totalHours = existingRoutines.reduce((sum, r) => {
      const [sh, sm] = r.startTime.split(':').map(Number);
      const [eh, em] = r.endTime.split(':').map(Number);
      return sum + (eh - sh) + (em - sm) / 60;
    }, 0);

    const [sh, sm] = req.body.startTime.split(':').map(Number);
    const [eh, em] = req.body.endTime.split(':').map(Number);
    const newHours = (eh - sh) + (em - sm) / 60;

    if (teacher.role === 'teacher' && (totalHours + newHours) > teacher.max_hours_per_week) {
      return res.status(400).json({
        message: `Teacher would exceed ${teacher.max_hours_per_week}h/week. Need HoD approval.`,
        requiresApproval: true,
        currentHours: totalHours,
        newHours,
        maxHours: teacher.max_hours_per_week,
      });
    }

    const routine = await Routine.create({ ...req.body, isApproved: req.teacher.role === 'hod' });
    res.status(201).json(routine);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/routines/:id — Update a routine entry.
router.put('/:id', protect, allowRoles('hod', 'dhod'), async (req, res) => {
  try {
    const routine = await Routine.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!routine) return res.status(404).json({ message: 'Routine not found' });
    res.json(routine);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/routines/:id — Delete a routine entry.
router.delete('/:id', protect, allowRoles('hod', 'dhod'), async (req, res) => {
  try {
    await Routine.findByIdAndDelete(req.params.id);
    res.json({ message: 'Routine entry deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/routines/:id/approve — Explicitly approve a routine (HoD only).
// Sets isApproved to true regardless of the previous value.
// This is used when a DHoD creates a routine (which defaults isApproved to false)
// and the HoD reviews and approves it afterwards.
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
