const mongoose = require('mongoose');

// Program schema — represents an academic degree program (e.g. BCE, BCT).
// Acts as the bridge between a Department (via department_code) and Subjects
// (subjects reference programs via their comma-separated program field).
// code is unique so it can be used as a stable foreign key in subjects and routines.
// duration_years defaults to 4 (most engineering bachelor's programs) but is
// overridden where needed (e.g. Architecture = 5).
const programSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  department_code: { type: String, required: true },
  duration_years: { type: Number, default: 4 },
}, { timestamps: true });

module.exports = mongoose.model('Program', programSchema);
