const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Teacher schema — core identity for every system user.
// email is unique so it can serve as the login identifier without collisions.
// password is hashed via a pre-save hook (never stored as plain text).
// role uses an enum restricting values to hod, dhod, or teacher so access
// control middleware can rely on discrete string comparisons.
// max_hours_per_week defaults to 15 as a sensible teaching load ceiling;
// this value can be overridden per teacher or raised through the approval workflow.
const teacherSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  contact: { type: String },
  designation: { type: String, required: true },
  department_code: { type: String, required: true },
  subject_codes: [{ type: String }],
  subject_taught: [{ type: String }],
  // programs lists the program codes (e.g. "BCT", "BEX") the teacher teaches
  // in. It is used to filter the teacher dropdown in the routine form so that
  // a department running multiple programs only shows relevant faculty.
  programs: [{ type: String }],
  role: { type: String, enum: ['hod', 'dhod', 'teacher'], default: 'teacher' },
  max_hours_per_week: { type: Number, default: 15 },
}, { timestamps: true });

// Pre-save hook that hashes the password with bcrypt (salt rounds = 12).
// Only re-hashes when the password field is actually modified so that
// saving other fields (e.g. name, role) does not re-hash an already-hashed value.
teacherSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method for comparing a candidate password against the stored hash.
// Used by the login route to avoid exposing the hashing implementation detail.
teacherSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Teacher', teacherSchema);
