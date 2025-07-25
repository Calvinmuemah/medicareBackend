// controllers/staff.controller.js
// --- Manages Hospital Staff (Doctors/Nurses) ---

const User = require('../models/User');
const Hospital = require('../models/Hospital');
const ErrorResponse = require('../utils/errorResponse');
const { USER_ROLES, STAFF_SPECIALTIES } = require('../utils/constants');
const logService = require('../services/log.service');

/**
 * Helpers
 */
const isSuperAdmin = (user) => user.role === USER_ROLES.SUPER_ADMIN;
const isHospitalAdmin = (user) => user.role === USER_ROLES.HOSPITAL_ADMIN;
const isStaff = (user) => user.role === USER_ROLES.STAFF;

/**
 * @desc    Add a staff member to a hospital
 * @route   POST /api/v1/hospitals/:hospitalId/staff
 * @access  Private (Hospital Admin only)
 */
exports.addStaff = async (req, res, next) => {
  const { hospitalId } = req.params;
  const { name, email, password, specialty } = req.body;

  try {
    // Only Hospital Admins can add staff to *their* hospital
    if (!isHospitalAdmin(req.user) || String(req.user.hospital) !== hospitalId) {
      return next(new ErrorResponse('Not authorized to add staff to this hospital', 403));
    }

    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return next(new ErrorResponse(`No hospital found with ID ${hospitalId}`, 404));
    }

    if (specialty && !STAFF_SPECIALTIES.includes(specialty)) {
      return next(new ErrorResponse(`Invalid specialty: ${specialty}`, 400));
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorResponse(`User with email '${email}' already exists`, 400));
    }

    const staffUser = await User.create({
      name,
      email,
      password,
      role: USER_ROLES.STAFF,
      hospital: hospitalId,
      specialty: specialty || 'Other',
    });

    await logService.logActivity(
      req.user._id,
      req.user.role,
      `Added staff member ${staffUser.name} to hospital ${hospital.name}`,
      'User',
      staffUser._id
    );

    res.status(201).json({ success: true, data: staffUser });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all staff members for a specific hospital
 * @route   GET /api/v1/hospitals/:hospitalId/staff
 * @access  Private (Super Admin, Hospital Admin of that hospital, Staff of that hospital)
 */
exports.getHospitalStaff = async (req, res, next) => {
  const { hospitalId } = req.params;

  try {
    const sameHospital = String(req.user.hospital) === hospitalId;

    if (!isSuperAdmin(req.user) && !sameHospital) {
      return next(new ErrorResponse('Not authorized to view staff for this hospital', 403));
    }

    const staff = await User.find({
      hospital: hospitalId,
      role: USER_ROLES.STAFF,
    }).populate('hospital', 'name');

    res.status(200).json({
      success: true,
      count: staff.length,
      data: staff,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get a single staff member
 * @route   GET /api/v1/staff/:id
 * @access  Private (Super Admin, Hospital Admin of same hospital, Staff themselves)
 */
exports.getStaff = async (req, res, next) => {
  try {
    const staff = await User.findById(req.params.id);

    if (!staff || staff.role !== USER_ROLES.STAFF) {
      return next(new ErrorResponse(`No staff member found with ID ${req.params.id}`, 404));
    }

    const sameHospital = String(staff.hospital) === String(req.user.hospital);
    const isSelf = String(staff._id) === String(req.user._id);

    if (
      !isSuperAdmin(req.user) &&
      !(
        (isHospitalAdmin(req.user) && sameHospital) ||
        (isStaff(req.user) && isSelf)
      )
    ) {
      return next(new ErrorResponse('Not authorized to view this staff member', 403));
    }

    res.status(200).json({ success: true, data: staff });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update a staff member's details
 * @route   PUT /api/v1/staff/:id
 * @access  Private (Super Admin, Hospital Admin of same hospital, Staff themselves)
 */
exports.updateStaff = async (req, res, next) => {
  const { name, email, specialty } = req.body; // No password updates here

  try {
    let staff = await User.findById(req.params.id);

    if (!staff || staff.role !== USER_ROLES.STAFF) {
      return next(new ErrorResponse(`No staff member found with ID ${req.params.id}`, 404));
    }

    const sameHospital = String(staff.hospital) === String(req.user.hospital);
    const isSelf = String(staff._id) === String(req.user._id);

    if (
      !isSuperAdmin(req.user) &&
      !(
        (isHospitalAdmin(req.user) && sameHospital) ||
        (isStaff(req.user) && isSelf)
      )
    ) {
      return next(new ErrorResponse('Not authorized to update this staff member', 403));
    }

    // Prevent changing role or hospital via this endpoint
    if (req.body.role || req.body.hospital) {
      return next(new ErrorResponse('Cannot change role or hospital via this endpoint', 400));
    }

    if (specialty && !STAFF_SPECIALTIES.includes(specialty)) {
      return next(new ErrorResponse(`Invalid specialty: ${specialty}`, 400));
    }

    staff = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, specialty },
      { new: true, runValidators: true }
    );

    await logService.logActivity(
      req.user._id,
      req.user.role,
      `Updated staff member: ${staff.name}`,
      'User',
      staff._id
    );

    res.status(200).json({ success: true, data: staff });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete a staff member
 * @route   DELETE /api/v1/staff/:id
 * @access  Private (Hospital Admin of same hospital, Super Admin)
 */
exports.deleteStaff = async (req, res, next) => {
  try {
    const staff = await User.findById(req.params.id);

    if (!staff || staff.role !== USER_ROLES.STAFF) {
      return next(new ErrorResponse(`No staff member found with ID ${req.params.id}`, 404));
    }

    const sameHospital = String(staff.hospital) === String(req.user.hospital);
    const isSelf = String(staff._id) === String(req.user._id);

    if (!isSuperAdmin(req.user) && !isHospitalAdmin(req.user)) {
      return next(new ErrorResponse('Not authorized to delete this staff member', 403));
    }

    if (isHospitalAdmin(req.user) && !sameHospital) {
      return next(new ErrorResponse('Not authorized to delete staff from another hospital', 403));
    }

    if (isSelf) {
      return next(new ErrorResponse('Cannot delete your own staff account', 400));
    }

    await staff.deleteOne();

    await logService.logActivity(
      req.user._id,
      req.user.role,
      `Deleted staff member: ${staff.name}`,
      'User',
      staff._id
    );

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
