// controllers/logs.controller.js
// --- Manages Activity Logs ---
const Log = require('../models/Log');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const { USER_ROLES } = require('../utils/constants');

// Utility function: Check if user is Super Admin
const isSuperAdmin = (user) => user.role === USER_ROLES.SUPER_ADMIN;

// Utility function: Check if Hospital Admin is authorized to access a user
const isHospitalAdminAuthorized = (admin, targetUser) =>
  admin.role === USER_ROLES.HOSPITAL_ADMIN &&
  String(admin.hospital) === String(targetUser.hospital);

// @desc    Get all activity logs
// @route   GET /api/v1/logs
// @access  Private (Super Admin only)
exports.getLogs = async (req, res, next) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return next(new ErrorResponse('Not authorized to view activity logs', 403));
    }

    const logs = await Log.find()
      .populate('user', 'name email role')
      .sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get logs for a specific user
// @route   GET /api/v1/users/:userId/logs
// @access  Private (Super Admin or Hospital Admin for users in their hospital)
exports.getUserLogs = async (req, res, next) => {
  const { userId } = req.params;

  try {
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return next(new ErrorResponse(`User with ID ${userId} not found`, 404));
    }

    // Authorization check
    if (
      !isSuperAdmin(req.user) &&
      !isHospitalAdminAuthorized(req.user, targetUser)
    ) {
      return next(
        new ErrorResponse('Not authorized to view this user\'s logs', 403)
      );
    }

    const logs = await Log.find({ user: userId })
      .populate('user', 'name email role')
      .sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (err) {
    next(err);
  }
};
