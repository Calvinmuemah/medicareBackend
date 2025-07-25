// --- Manages Hospital and Hospital Admin Creation ---
const Hospital = require('../models/Hospital');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const { USER_ROLES } = require('../utils/constants');
const logService = require('../services/log.service');

// @desc    Onboard a new hospital
// @route   POST /api/v1/hospitals
// @access  Private (Super Admin only)
exports.onboardHospital = async (req, res, next) => {
  const { name, address, phone, email, description } = req.body;

  try {
    const existingHospital = await Hospital.findOne({ name });
    if (existingHospital) {
      return next(new ErrorResponse(`Hospital with name '${name}' already exists`, 400));
    }

    const hospital = await Hospital.create({ name, address, phone, email, description });

    await logService.logActivity(
      req.user._id,
      req.user.role,
      `Onboarded new hospital: ${hospital.name}`,
      'Hospital',
      hospital._id
    );

    res.status(201).json({ success: true, data: hospital });
  } catch (err) {
    next(err);
  }
};

// @desc    Add a hospital admin for a hospital
// @route   POST /api/v1/hospitals/:hospitalId/admin
// @access  Private (Super Admin only)
exports.addHospitalAdmin = async (req, res, next) => {
  const { hospitalId } = req.params;
  const { name, email, password } = req.body;

  try {
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return next(new ErrorResponse(`No hospital found with ID ${hospitalId}`, 404));
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorResponse(`User with email '${email}' already exists`, 400));
    }

    const adminUser = await User.create({
      name,
      email,
      password,
      role: USER_ROLES.HOSPITAL_ADMIN,
      hospital: hospitalId,
    });

    await logService.logActivity(
      req.user._id,
      req.user.role,
      `Added hospital admin ${adminUser.name} to hospital ${hospital.name}`,
      'User',
      adminUser._id
    );

    res.status(201).json({ success: true, data: adminUser });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all hospitals
// @route   GET /api/v1/hospitals
// @access  Private (Super Admin, Hospital Admin)
exports.getHospitals = async (req, res, next) => {
  try {
    const hospitals = req.user.role === USER_ROLES.HOSPITAL_ADMIN
      ? [await Hospital.findById(req.user.hospital)]
      : await Hospital.find();

    res.status(200).json({
      success: true,
      count: hospitals.length,
      data: hospitals,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get a single hospital
// @route   GET /api/v1/hospitals/:id
// @access  Private (Super Admin, Hospital Admin)
exports.getHospital = async (req, res, next) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return next(new ErrorResponse(`No hospital found with ID ${req.params.id}`, 404));
    }

    if (
      req.user.role === USER_ROLES.HOSPITAL_ADMIN &&
      String(hospital._id) !== String(req.user.hospital)
    ) {
      return next(new ErrorResponse('Not authorized to view this hospital', 403));
    }

    res.status(200).json({ success: true, data: hospital });
  } catch (err) {
    next(err);
  }
};

// @desc    Update hospital details
// @route   PUT /api/v1/hospitals/:id
// @access  Private (Super Admin, Hospital Admin)
exports.updateHospital = async (req, res, next) => {
  try {
    let hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return next(new ErrorResponse(`No hospital found with ID ${req.params.id}`, 404));
    }

    if (
      req.user.role === USER_ROLES.HOSPITAL_ADMIN &&
      String(hospital._id) !== String(req.user.hospital)
    ) {
      return next(new ErrorResponse('Not authorized to update this hospital', 403));
    }

    hospital = await Hospital.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    await logService.logActivity(
      req.user._id,
      req.user.role,
      `Updated hospital: ${hospital.name}`,
      'Hospital',
      hospital._id
    );

    res.status(200).json({ success: true, data: hospital });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete hospital
// @route   DELETE /api/v1/hospitals/:id
// @access  Private (Super Admin only)
exports.deleteHospital = async (req, res, next) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return next(new ErrorResponse(`No hospital found with ID ${req.params.id}`, 404));
    }

    // TODO: Consider cascading delete or soft delete in production
    await hospital.deleteOne();

    await logService.logActivity(
      req.user._id,
      req.user.role,
      `Deleted hospital: ${hospital.name}`,
      'Hospital',
      hospital._id
    );

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
