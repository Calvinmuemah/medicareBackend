// --- Handles User Registration and Login ---
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Patient = require('../models/Patient');
const ErrorResponse = require('../utils/errorResponse');
const { USER_ROLES } = require('../utils/constants');
const logService = require('../services/log.service');

// Generate JWT and send it via cookie + response
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_LIFETIME,
  });

  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_LIFETIME * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
  };

  res.status(statusCode).cookie('token', token, cookieOptions).json({
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

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  const {
    name,
    email,
    password,
    role,
    hospitalId,
    dateOfBirth,
    edd,
    emergencyContactName,
    emergencyContactPhone,
    specialty,
  } = req.body;

  try {
    // Basic validation
    if (!name || !email || !password || !role) {
      return next(new ErrorResponse('Name, email, password, and role are required', 400));
    }

    if (password.length < 6) {
      return next(new ErrorResponse('Password must be at least 6 characters', 400));
    }

    // Validate hospital if not superadmin
    let hospital = null;
    if (role !== USER_ROLES.SUPER_ADMIN) {
      if (!hospitalId) {
        return next(new ErrorResponse('Hospital ID is required for this role', 400));
      }

      hospital = await Hospital.findById(hospitalId);
      if (!hospital) {
        return next(new ErrorResponse(`No hospital found with ID ${hospitalId}`, 404));
      }
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      hospital: hospitalId || null,
      specialty: role === USER_ROLES.STAFF ? specialty : undefined,
    });

    // Create patient record if role is patient
    if (role === USER_ROLES.PATIENT) {
      if (!dateOfBirth || !edd || !emergencyContactName || !emergencyContactPhone) {
        return next(new ErrorResponse('Patient details (DOB, EDD, emergency contact) are required', 400));
      }

      await Patient.create({
        user: user._id,
        hospital: hospitalId,
        dateOfBirth,
        edd,
        emergencyContactName,
        emergencyContactPhone,
        registeredBy: req.user ? req.user._id : user._id,
      });
    }

    await logService.logActivity(
      user._id,
      user.role,
      `Registered new user: ${user.name} (${user.role})`,
      'User',
      user._id
    );

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  try {
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    await logService.logActivity(user._id, user.role, 'Logged in', 'Auth', user._id);

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged-in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// @desc    Logout user and clear token cookie
// @route   GET /api/v1/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  await logService.logActivity(req.user._id, req.user.role, 'Logged out', 'Auth', req.user._id);

  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    sameSite: 'Lax',
  });

  res.status(200).json({ success: true, data: {} });
};
