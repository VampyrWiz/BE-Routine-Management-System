// Role-based access control middleware.
// allowRoles is a higher-order function that accepts one or more role strings
// (e.g. 'hod', 'dhod') and returns a middleware that checks if
// req.teacher.role is among the allowed set. If not, it responds with 403.
// This design keeps the role-check logic declarative at the route level:
//   router.get('/', protect, allowRoles('hod', 'dhod'), handler)
//
// hodOnly is a convenience wrapper for routes that only HoDs may access.
// It is used separately from allowRoles because some endpoints (e.g. the
// routine approve endpoint) check specifically for HoD rather than a list
// of roles, making the intent clearer at the call site.
const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.teacher.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient privileges' });
    }
    next();
  };
};

const hodOnly = (req, res, next) => {
  if (req.teacher.role !== 'hod') {
    return res.status(403).json({ message: 'Only HoD can perform this action' });
  }
  next();
};

module.exports = { allowRoles, hodOnly };
