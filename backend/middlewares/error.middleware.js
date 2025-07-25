// --- Centralized Error Handling Middleware ---
const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error(err.stack); // Log stack trace for debugging

  // Mongoose: Invalid ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new ErrorResponse(message, 404);
  }

  // Mongoose: Duplicate Key
  if (err.code === 11000) {
    const message = `Duplicate field value entered: ${Object.keys(err.keyValue)} already exists`;
    error = new ErrorResponse(message, 400);
  }

  // Mongoose: Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    error = new ErrorResponse(messages.join(', '), 400);
  }

  // JWT: Invalid or Expired
  if (err.name === 'JsonWebTokenError') {
    error = new ErrorResponse('Invalid token, please log in again', 401);
  }
  if (err.name === 'TokenExpiredError') {
    error = new ErrorResponse('Token expired, please log in again', 401);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
  });
};

module.exports = errorHandler;
