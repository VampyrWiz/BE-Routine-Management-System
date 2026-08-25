const mongoose = require('mongoose');

// Subject schema — represents a single course offering within one or more programs.
// L, T, P, and totalHours track lecture, tutorial, practical, and combined hours
// separately so the routine system can validate teacher workloads per type.
// code + program form a compound unique index because the same subject code
// (e.g. "ENSH 101") can appear in multiple programs, but only once per program.
// The program field stores a comma-separated list of program codes (e.g. "BCE, BEL")
// so that a shared subject (like Engineering Mathematics I) can belong to
// multiple programs without duplicating the document. This design is a pragmatic
// trade-off to avoid a join collection while keeping queries filterable via $regex.
const subjectSchema = new mongoose.Schema({
  code: { type: String, required: true },
  title: { type: String, required: true },
  credits: { type: Number, default: 0 },
  L: { type: Number, default: 0 },
  T: { type: Number, default: 0 },
  P: { type: Number, default: 0 },
  totalHours: { type: Number, default: 0 },
  theoryAssessmentMarks: { type: Number, default: 0 },
  theoryFinalMarks: { type: Number, default: 0 },
  theoryDuration: { type: Number, default: 0 },
  practicalAssessmentMarks: { type: Number, default: 0 },
  practicalFinalMarks: { type: Number, default: 0 },
  practicalDuration: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 },
  year: { type: Number, required: true },
  part: { type: Number, required: true },
  semester: { type: String },
  program: { type: String },
  remark: { type: String, default: '' },
}, { timestamps: true });

// Compound unique index prevents the same subject code from being inserted
// twice for the same program, but allows the code to exist across programs.
subjectSchema.index({ code: 1, program: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);
