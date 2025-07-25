const Patient = require('../models/Patient');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const { USER_ROLES } = require('../utils/constants');
const logService = require('../services/log.service');

// --- Register a New Patient ---
// @route   POST /api/v1/patients
// @access  Private (Staff only)
exports.registerPatient = async (req, res, next) => {
  const {
    name, email, password, dateOfBirth, edd,
    emergencyContactName, emergencyContactPhone, bloodGroup,
  } = req.body;

  try {
    if (req.user.role !== USER_ROLES.STAFF) {
      return next(new ErrorResponse('Only staff members can register new patients', 403));
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorResponse(`User with email '${email}' already exists`, 400));
    }

    const patientUser = await User.create({
      name,
      email,
      password,
      role: USER_ROLES.PATIENT,
      hospital: req.user.hospital,
    });

    const patient = await Patient.create({
      user: patientUser._id,
      hospital: req.user.hospital,
      dateOfBirth,
      edd,
      emergencyContactName,
      emergencyContactPhone,
      bloodGroup,
      registeredBy: req.user._id,
    });

    await logService.logActivity(
      req.user._id,
      req.user.role,
      `Registered new patient: ${patientUser.name}`,
      'Patient',
      patient._id
    );

    res.status(201).json({
      success: true,
      data: { patientUser, patient },
    });
  } catch (error) {
    next(error);
  }
};

// --- Get All Patients for a Hospital ---
// @route   GET /api/v1/hospitals/:hospitalId/patients
// @access  Private (Hospital Admin, Staff)
exports.getHospitalPatients = async (req, res, next) => {
  const { hospitalId } = req.params;

  try {
    const authorized =
      req.user.role === USER_ROLES.SUPER_ADMIN ||
      String(req.user.hospital) === hospitalId;

    if (!authorized) {
      return next(new ErrorResponse('Not authorized to view patients for this hospital', 403));
    }

    const patients = await Patient.find({ hospital: hospitalId })
      .populate('user', 'name email')
      .populate('registeredBy', 'name');

    res.status(200).json({
      success: true,
      count: patients.length,
      data: patients,
    });
  } catch (error) {
    next(error);
  }
};

// --- Get a Single Patient ---
// @route   GET /api/v1/patients/:id
// @access  Private (Hospital Admin, Staff, Patient)
exports.getPatient = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('user', 'name email role')
      .populate('hospital', 'name');

    if (!patient) {
      return next(new ErrorResponse(`No patient found with ID ${req.params.id}`, 404));
    }

    const isStaffOrAdmin = [USER_ROLES.HOSPITAL_ADMIN, USER_ROLES.STAFF].includes(req.user.role);
    const isSameHospital = String(patient.hospital) === String(req.user.hospital);
    const isPatientHimself = String(patient.user._id) === String(req.user._id);

    if ((isStaffOrAdmin && !isSameHospital) || (req.user.role === USER_ROLES.PATIENT && !isPatientHimself)) {
      return next(new ErrorResponse('Not authorized to view this patient', 403));
    }

    res.status(200).json({ success: true, data: patient });
  } catch (error) {
    next(error);
  }
};

// --- Update Patient Details ---
// @route   PUT /api/v1/patients/:id
// @access  Private (Hospital Admin, Staff)
exports.updatePatient = async (req, res, next) => {
  const updateFields = (({
    dateOfBirth, edd, emergencyContactName,
    emergencyContactPhone, bloodGroup,
  }) => ({
    dateOfBirth, edd, emergencyContactName,
    emergencyContactPhone, bloodGroup,
  }))(req.body);

  try {
    let patient = await Patient.findById(req.params.id).populate('user', 'name');

    if (!patient) {
      return next(new ErrorResponse(`No patient found with ID ${req.params.id}`, 404));
    }

    const isAuthorized =
      [USER_ROLES.HOSPITAL_ADMIN, USER_ROLES.STAFF].includes(req.user.role) &&
      String(patient.hospital) === String(req.user.hospital);

    if (!isAuthorized) {
      return next(new ErrorResponse('Not authorized to update this patient', 403));
    }

    if (req.user.role === USER_ROLES.PATIENT) {
      return next(new ErrorResponse('Patients cannot update their own details via this endpoint', 403));
    }

    patient = await Patient.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true,
    });

    await logService.logActivity(
      req.user._id,
      req.user.role,
      `Updated patient details for: ${patient.user.name}`,
      'Patient',
      patient._id
    );

    res.status(200).json({ success: true, data: patient });
  } catch (error) {
    next(error);
  }
};

// --- Delete a Patient and their User Account ---
// @route   DELETE /api/v1/patients/:id
// @access  Private (Hospital Admin only)
exports.deletePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return next(new ErrorResponse(`No patient found with ID ${req.params.id}`, 404));
    }

    const isAuthorized =
      req.user.role === USER_ROLES.HOSPITAL_ADMIN &&
      String(patient.hospital) === String(req.user.hospital);

    if (!isAuthorized) {
      return next(new ErrorResponse('Not authorized to delete this patient', 403));
    }

    await User.deleteOne({ _id: patient.user });
    await patient.deleteOne();

    await logService.logActivity(
      req.user._id,
      req.user.role,
      `Deleted patient and their user account (ID: ${patient.user})`,
      'Patient',
      patient._id
    );

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
