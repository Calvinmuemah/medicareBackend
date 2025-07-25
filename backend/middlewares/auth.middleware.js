// --- Middleware for JWT Authentication ---
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse'); // Custom error class

// Protect routes by verifying JWT token
exports.protect = async (req, res, next) => {
  let token;

  // Check for token in headers (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by ID from the token payload
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return next(new ErrorResponse('User not found', 404));
    }
    next();
  } catch (error) {
    console.error(error);
    return next(new ErrorResponse('Not authorized to access this route (invalid token)', 401));
  }
};
