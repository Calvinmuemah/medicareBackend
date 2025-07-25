const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const { USER_ROLES, APPOINTMENT_TYPES, APPOINTMENT_STATUSES } = require('../utils/constants');
const logService = require('../services/log.service');

// @desc    Create a new appointment
// @route   POST /api/v1/appointments
// @access  Private (Staff only)
exports.createAppointment = async (req, res, next) => {
  const { patientId, date, type, notes } = req.body;

  try {
    if (req.user.role !== USER_ROLES.STAFF) {
      return next(new ErrorResponse('Only staff members can create appointments', 403));
    }

    const patient = await Patient.findById(patientId);
    if (!patient) return next(new ErrorResponse(`No patient found with ID ${patientId}`, 404));
    if (String(patient.hospital) !== String(req.user.hospital)) {
      return next(new ErrorResponse('Cannot create appointment for another hospital', 403));
    }

    if (type && !APPOINTMENT_TYPES.includes(type)) {
      return next(new ErrorResponse(`Invalid appointment type: ${type}`, 400));
    }

    const appointment = await Appointment.create({
      patient: patientId,
      hospital: req.user.hospital,
      staff: req.user._id,
      date,
      type: type || 'Antenatal Checkup',
      notes,
    });

    await logService.logActivity(
      req.user._id,
      req.user.role,
      `Created appointment for patient ${patientId} on ${date}`,
      'Appointment',
      appointment._id
    );

    res.status(201).json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all appointments
// @route   GET /api/v1/appointments
// @access  Private (Hospital Admin, Staff, Patient)
exports.getAppointments = async (req, res, next) => {
  try {
    let query;

    switch (req.user.role) {
      case USER_ROLES.SUPER_ADMIN:
        query = Appointment.find();
        break;
      case USER_ROLES.HOSPITAL_ADMIN:
      case USER_ROLES.STAFF:
        query = Appointment.find({ hospital: req.user.hospital });
        break;
      case USER_ROLES.PATIENT:
        const patient = await Patient.findOne({ user: req.user._id });
        if (!patient) return next(new ErrorResponse('Patient profile not found', 404));
        query = Appointment.find({ patient: patient._id });
        break;
      default:
        return next(new ErrorResponse('Not authorized to view appointments', 403));
    }

    const appointments = await query
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'name email' }
      })
      .populate('staff', 'name email');

    res.status(200).json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single appointment
// @route   GET /api/v1/appointments/:id
// @access  Private (Hospital Admin, Staff, Patient)
exports.getAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'name email' }
      })
      .populate('staff', 'name email');

    if (!appointment) {
      return next(new ErrorResponse(`No appointment found with ID ${req.params.id}`, 404));
    }

    const isAuthorized =
      req.user.role === USER_ROLES.SUPER_ADMIN ||
      (appointment.hospital.equals(req.user.hospital) &&
        (req.user.role === USER_ROLES.HOSPITAL_ADMIN || req.user.role === USER_ROLES.STAFF)) ||
      (req.user.role === USER_ROLES.PATIENT &&
        (await Patient.findOne({ _id: appointment.patient, user: req.user._id })));

    if (!isAuthorized) {
      return next(new ErrorResponse('Not authorized to view this appointment', 403));
    }

    res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an appointment
// @route   PUT /api/v1/appointments/:id
// @access  Private (Hospital Admin, Staff)
exports.updateAppointment = async (req, res, next) => {
  const { date, type, status, notes } = req.body;

  try {
    let appointment = await Appointment.findById(req.params.id);
    if (!appointment) return next(new ErrorResponse(`No appointment found with ID ${req.params.id}`, 404));

    if (
      (req.user.role === USER_ROLES.HOSPITAL_ADMIN || req.user.role === USER_ROLES.STAFF) &&
      !appointment.hospital.equals(req.user.hospital)
    ) {
      return next(new ErrorResponse('Not authorized to update this appointment', 403));
    }

    if (req.user.role === USER_ROLES.PATIENT) {
      return next(new ErrorResponse('Patients cannot update appointments', 403));
    }

    if (type && !APPOINTMENT_TYPES.includes(type)) {
      return next(new ErrorResponse(`Invalid appointment type: ${type}`, 400));
    }

    if (status && !APPOINTMENT_STATUSES.includes(status)) {
      return next(new ErrorResponse(`Invalid appointment status: ${status}`, 400));
    }

    const updates = { date, type, status, notes };
    appointment = await Appointment.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    await logService.logActivity(
      req.user._id,
      req.user.role,
      `Updated appointment ${appointment._id}`,
      'Appointment',
      appointment._id
    );

    res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an appointment
// @route   DELETE /api/v1/appointments/:id
// @access  Private (Hospital Admin, Staff)
exports.deleteAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return next(new ErrorResponse(`No appointment found with ID ${req.params.id}`, 404));

    if (
      (req.user.role === USER_ROLES.HOSPITAL_ADMIN || req.user.role === USER_ROLES.STAFF) &&
      !appointment.hospital.equals(req.user.hospital)
    ) {
      return next(new ErrorResponse('Not authorized to delete this appointment', 403));
    }

    if (req.user.role === USER_ROLES.PATIENT) {
      return next(new ErrorResponse('Patients cannot delete appointments', 403));
    }

    await appointment.deleteOne();

    await logService.logActivity(
      req.user._id,
      req.user.role,
      `Deleted appointment ${req.params.id}`,
      'Appointment',
      req.params.id
    );

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
