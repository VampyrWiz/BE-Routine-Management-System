const express = require('express');
const Subject = require('../models/Subject');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/subjects — List subjects with optional query filters.
// The program filter uses $regex because the program field stores a comma-
// separated list (e.g. "BCE, BEL"). A simple equality match would fail for
// programs that share a subject; regex allows matching against any program
// within the comma-separated string (e.g. ?program=BCE matches any subject
// whose program contains "BCE"). The 'i' flag makes the match case-insensitive.
// Results are sorted by year, part, and code for predictable display order.
router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.program) filter.program = { $regex: req.query.program, $options: 'i' };
    if (req.query.year) filter.year = parseInt(req.query.year);
    if (req.query.part) filter.part = parseInt(req.query.part);
    if (req.query.semester) filter.semester = req.query.semester;
    const subjects = await Subject.find(filter).sort({ year: 1, part: 1, code: 1 });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/subjects/:id — Get a single subject by its MongoDB _id.
router.get('/:id', protect, async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json(subject);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/subjects — Create a new subject.
router.post('/', protect, async (req, res) => {
  try {
    const subject = await Subject.create(req.body);
    res.status(201).json(subject);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/subjects/:id — Update an existing subject.
router.put('/:id', protect, async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json(subject);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/subjects/:id — Delete a subject.
router.delete('/:id', protect, async (req, res) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ message: 'Subject deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
