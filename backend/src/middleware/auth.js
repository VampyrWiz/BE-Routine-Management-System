const jwt = require('jsonwebtoken');
const Teacher = require('../models/Teacher');

// Protects routes by verifying a JWT Bearer token from the Authorization header.
// The token is extracted by splitting the "Bearer <token>" string and taking
// the second part. If no token is present, a 401 is returned immediately.
// On successful verification, the decoded teacher ID is used to fetch the
// Teacher document (excluding the password field) and attach it to req.teacher.
// This ensures downstream middleware and route handlers have access to the
// authenticated teacher's data (role, department_code, etc.) without needing
// to look it up again. A failed verification (expired / invalid token) returns 401.
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.teacher = await Teacher.findById(decoded.id).select('-password');
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token failed' });
  }
};

module.exports = { protect };
