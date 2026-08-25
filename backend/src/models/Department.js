const mongoose = require('mongoose');

// Department schema — lightweight reference entity for the organisational unit
// (e.g. Department of Civil Engineering). Each teacher, program, and routine
// links back to a department via its unique code string. Storing departments
// as a dedicated collection rather than an enum allows dynamic addition
// without code changes and provides a single source of truth for department names.
const departmentSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);
