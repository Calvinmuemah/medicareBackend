// --- Handles User Registration and Login ---
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Patient = require('../models/Patient');
const ErrorResponse = require('../utils/errorResponse');
const { USER_ROLES } = require('../utils/constants');
const logService = require('../services/log.service');

// Generate JWT and send it via response only (no cookies)
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_LIFETIME,
  });

  res.status(statusCode).json({
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
    if (!name || !email || !password || !role) {
      return next(new ErrorResponse('Name, email, password, and role are required', 400));
    }

    if (password.length < 6) {
      return next(new ErrorResponse('Password must be at least 6 characters', 400));
    }

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

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorResponse('Email already exists', 400));
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      hospital: hospitalId || null,
      specialty: role === USER_ROLES.STAFF ? specialty : undefined,
    });

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

// @desc    Logout user
// @route   GET /api/v1/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  await logService.logActivity(req.user._id, req.user.role, 'Logged out', 'Auth', req.user._id);

  res.status(200).json({ success: true, message: 'Logged out successfully' });
};
