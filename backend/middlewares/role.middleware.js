// --- Middleware for Role-Based Access Control (RBAC) ---
const ErrorResponse = require('../utils/errorResponse');

// Authorize roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role ${req.user.role} is not authorized to access this route`,
          403 // Forbidden
        )
      );
    }
    next();
  };
};
