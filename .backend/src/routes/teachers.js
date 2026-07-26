const express = require('express');
const Teacher = require('../models/Teacher');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roles');

const router = express.Router();

// GET /api/teachers — List teachers with role-based scoping.
// HoD can see all teachers across all departments.
// DHoD is restricted to teachers within their own department by adding
// a department_code filter. This prevents a DHoD from accessing or modifying
// teacher data outside their organisational scope.
// The -password projection ensures hashed passwords are never exposed.
router.get('/', protect, allowRoles('hod', 'dhod'), async (req, res) => {
  try {
    const filter = {};
    if (req.teacher.role === 'dhod') {
      filter.department_code = req.teacher.department_code;
    }
    const teachers = await Teacher.find(filter).select('-password');
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/teachers — Create a new teacher (HoD only).
router.post('/', protect, allowRoles('hod'), async (req, res) => {
  try {
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
