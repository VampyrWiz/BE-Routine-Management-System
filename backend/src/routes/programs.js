const express = require('express');
const Program = require('../models/Program');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/programs — List all programs sorted by code.
// Programs act as a reference list for dropdowns and to link subjects
// (via the program field) to departments.
router.get('/', protect, async (req, res) => {
  try {
    const programs = await Program.find().sort({ code: 1 });
    res.json(programs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/programs — Create a new program.
router.post('/', protect, async (req, res) => {
  try {
    const program = await Program.create(req.body);
    res.status(201).json(program);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/programs/:id — Update a program.
router.put('/:id', protect, async (req, res) => {
  try {
    const program = await Program.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!program) return res.status(404).json({ message: 'Program not found' });
    res.json(program);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/programs/:id — Delete a program.
router.delete('/:id', protect, async (req, res) => {
  try {
    await Program.findByIdAndDelete(req.params.id);
    res.json({ message: 'Program deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
