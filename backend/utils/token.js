// utils/token.js
const jwt = require('jsonwebtoken');

// Send token via cookie + response
exports.sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken(); // Method defined in User model

  const options = {
    expires: new Date(Date.now() + process.env.JWT_LIFETIME * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      hospital: user.hospital,
    },
  });
};
