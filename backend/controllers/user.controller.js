// controllers/user.controller.js
// --- General User Management ---
const User = require('../models/User');
const Patient = require('../models/Patient'); // Ensure this exists if handling patient deletion
const ErrorResponse = require('../utils/errorResponse');
const logService = require('../services/log.service');
const { USER_ROLES } = require('../utils/constants');

// @desc    Get all users (Super Admin only)
// @route   GET /api/v1/users
// @access  Private (Super Admin)
exports.getUsers = async (req, res, next) => {
  try {
    if (req.user.role !== USER_ROLES.SUPER_ADMIN) {
      return next(new ErrorResponse('Not authorized to view all users', 403));
    }

    const users = await User.find().populate('hospital', 'name');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single user
// @route   GET /api/v1/users/:id
// @access  Private (role-based access)
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('hospital', 'name');

    if (!user) {
      return next(new ErrorResponse(`No user found with ID ${req.params.id}`, 404));
    }

    const sameHospital = String(user.hospital) === String(req.user.hospital);

    // Hospital Admin: only access users in their hospital
    if (req.user.role === USER_ROLES.HOSPITAL_ADMIN && !sameHospital) {
      return next(new ErrorResponse('Not authorized to view this user', 403));
    }

    // Staff: only view patients in their hospital
    if (req.user.role === USER_ROLES.STAFF) {
      if (user.role !== USER_ROLES.PATIENT || !sameHospital) {
        return next(new ErrorResponse('Not authorized to view this user', 403));
      }
    }

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Private (Super Admin, Hospital Admin for their org, Staff for patients)
exports.updateUser = async (req, res, next) => {
  const { name, email, role, hospitalId, specialty } = req.body;

  try {
    let user = await User.findById(req.params.id);
    if (!user) {
      return next(new ErrorResponse(`No user found with ID ${req.params.id}`, 404));
    }

    const sameHospital = String(user.hospital) === String(req.user.hospital);

    // Role-based update permissions
    if (req.user.role === USER_ROLES.HOSPITAL_ADMIN && !sameHospital) {
      return next(new ErrorResponse('Not authorized to update this user', 403));
    }
    if (req.user.role === USER_ROLES.STAFF) {
      if (user.role !== USER_ROLES.PATIENT || !sameHospital) {
        return next(new ErrorResponse('Not authorized to update this user', 403));
      }
    }

    // Restrict role/hospital updates unless Super Admin
    if (req.user.role !== USER_ROLES.SUPER_ADMIN && (role || hospitalId)) {
      return next(new ErrorResponse('Cannot change user role or hospital', 403));
    }

    // Prepare update fields
    const updateFields = { name, email };
    if (req.user.role === USER_ROLES.SUPER_ADMIN) {
      if (role) updateFields.role = role;
      if (hospitalId) updateFields.hospital = hospitalId;
    }
    if (user.role === USER_ROLES.STAFF && specialty) {
      updateFields.specialty = specialty;
    }

    user = await User.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true,
    });

    await logService.logActivity(
      req.user._id,
      req.user.role,
      `Updated user: ${user.name} (${user.role})`,
      'User',
      user._id
    );

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Private (Super Admin or Hospital Admin within org)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new ErrorResponse(`No user found with ID ${req.params.id}`, 404));
    }

    const sameHospital = String(user.hospital) === String(req.user.hospital);

    // Role-based restrictions
    if (req.user.role === USER_ROLES.HOSPITAL_ADMIN && !sameHospital) {
      return next(new ErrorResponse('Not authorized to delete this user', 403));
    }
    if (String(user._id) === String(req.user._id)) {
      return next(new ErrorResponse('Cannot delete your own account via this endpoint', 400));
    }
    if (user.role === USER_ROLES.SUPER_ADMIN && req.user.role !== USER_ROLES.SUPER_ADMIN) {
      return next(new ErrorResponse('Not authorized to delete a Super Admin', 403));
    }
    if (user.role === USER_ROLES.HOSPITAL_ADMIN && req.user.role === USER_ROLES.STAFF) {
      return next(new ErrorResponse('Not authorized to delete a Hospital Admin', 403));
    }

    // Delete linked patient record if applicable
    if (user.role === USER_ROLES.PATIENT) {
      await Patient.deleteOne({ user: user._id });
    }

    await user.deleteOne();

    await logService.logActivity(
      req.user._id,
      req.user.role,
      `Deleted user: ${user.name} (${user.role})`,
      'User',
      user._id
    );

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
