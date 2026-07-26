const express = require('express');
const jwt = require('jsonwebtoken');
const Teacher = require('../models/Teacher');
const { protect } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login — Authenticates a teacher with email + password.
// Looks up the teacher by email, then uses the comparePassword instance
// method to check the candidate password against the stored bcrypt hash.
// On success, signs a JWT containing the teacher's _id that expires in 7 days.
// The response returns the token along with a teacher object (excluding password)
// so the frontend can store the token and display user info immediately.
// A single "Invalid credentials" message for both missing-user and wrong-password
// cases avoids leaking information about which accounts exist.
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const teacher = await Teacher.findOne({ email });
    if (!teacher) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const isMatch = await teacher.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: teacher._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      teacher: {
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        role: teacher.role,
        department_code: teacher.department_code,
        designation: teacher.designation,
        subject_codes: teacher.subject_codes,
        max_hours_per_week: teacher.max_hours_per_week,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me — Returns the currently authenticated teacher's profile.
// The 'protect' middleware handles token verification and attaches the teacher
// document to req.teacher (with the password field already excluded).
// This endpoint is used by the frontend to validate stored tokens on app load.
router.get('/me', protect, async (req, res) => {
  res.json(req.teacher);
});

// PUT /api/auth/profile — Allows the authenticated teacher to update their own
// name, email, contact, designation, and optionally their password. Each field is
// applied conditionally so the caller only sends what they want to change. If a new
// password is supplied, the pre-save hook on the Teacher model re-hashes it before
// persisting. The full teacher object is returned so the frontend can replace its
// stored profile (via AuthContext.updateTeacher) without a separate GET request.
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, email, contact, designation, password } = req.body;
    const teacher = await Teacher.findById(req.teacher._id);

    if (name !== undefined) teacher.name = name;
    if (email !== undefined) teacher.email = email;
    if (contact !== undefined) teacher.contact = contact;
    if (designation !== undefined) teacher.designation = designation;
    if (password) teacher.password = password;

    const updated = await teacher.save();

    res.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      department_code: updated.department_code,
      designation: updated.designation,
      contact: updated.contact,
      subject_codes: updated.subject_codes,
      max_hours_per_week: updated.max_hours_per_week,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
