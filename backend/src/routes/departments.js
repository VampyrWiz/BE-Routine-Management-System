const express = require('express');
const Department = require('../models/Department');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/departments — List all departments sorted by code.
// Departments are a simple reference entity used to populate dropdowns
// and to group teachers, programs, and routines.
router.get('/', protect, async (req, res) => {
  try {
    const departments = await Department.find().sort({ code: 1 });
    res.json(departments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/departments — Create a new department.
router.post('/', protect, async (req, res) => {
  try {
    const dept = await Department.create(req.body);
    res.status(201).json(dept);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
