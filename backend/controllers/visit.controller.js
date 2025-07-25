// --- Manages Patient Visits ---
const Visit = require('../models/Visit');
const Patient = require('../models/Patient');
const ErrorResponse = require('../utils/errorResponse');
const { USER_ROLES, VISIT_TYPES } = require('../utils/constants');
const logService = require('../services/log.service');

// @desc    Create a new patient visit
// @route   POST /api/v1/patients/:patientId/visits
// @access  Private (Staff only)
exports.createVisit = async (req, res, next) => {
  try {
    if (req.user.role !== USER_ROLES.STAFF) {
      return next(new ErrorResponse('Only staff members can create visit records', 403));
    }

    const { patientId } = req.params;
    const { visitDate, visitType, notes, weight, bloodPressure, fetalHeartRate, fundalHeight } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) return next(new ErrorResponse(`No patient found with ID ${patientId}`, 404));
    if (String(patient.hospital) !== String(req.user.hospital)) {
      return next(new ErrorResponse('Cannot create visit for patient outside your hospital', 403));
    }

    if (visitType && !VISIT_TYPES.includes(visitType)) {
      return next(new ErrorResponse(`Invalid visit type: ${visitType}`, 400));
    }

    const visit = await Visit.create({
      patient: patientId,
      hospital: req.user.hospital,
      staff: req.user._id,
      visitDate,
      visitType: visitType || 'Antenatal',
      notes,
      weight,
      bloodPressure,
      fetalHeartRate,
      fundalHeight,
    });

    await logService.logActivity(req.user._id, req.user.role, `Created visit for patient ${patientId}`, 'Visit', visit._id);

    res.status(201).json({ success: true, data: visit });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all visits for a patient
// @route   GET /api/v1/patients/:patientId/visits
// @access  Private (Hospital Admin, Staff, Patient)
exports.getPatientVisits = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.patientId);
    if (!patient) return next(new ErrorResponse('Patient not found', 404));

    // Authorization
    if (
      (req.user.role === USER_ROLES.HOSPITAL_ADMIN || req.user.role === USER_ROLES.STAFF) &&
      String(patient.hospital) !== String(req.user.hospital)
    ) {
      return next(new ErrorResponse('Not authorized to view this patient’s visits', 403));
    }

    if (
      req.user.role === USER_ROLES.PATIENT &&
      String(patient.user) !== String(req.user._id)
    ) {
      return next(new ErrorResponse('Not authorized to view another patient’s visits', 403));
    }

    const visits = await Visit.find({ patient: patient._id })
      .populate('staff', 'name email')
      .sort({ visitDate: -1 });

    res.status(200).json({ success: true, count: visits.length, data: visits });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single visit
// @route   GET /api/v1/visits/:id
// @access  Private (Staff, Admin, Patient)
exports.getVisit = async (req, res, next) => {
  try {
    const visit = await Visit.findById(req.params.id)
      .populate('staff', 'name email')
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'name email' }
      });

    if (!visit) return next(new ErrorResponse('Visit not found', 404));

    const { hospital, patient } = visit;

    if (req.user.role === USER_ROLES.SUPER_ADMIN) {
      // Full access
    } else if (
      (req.user.role === USER_ROLES.HOSPITAL_ADMIN || req.user.role === USER_ROLES.STAFF) &&
      String(hospital) !== String(req.user.hospital)
    ) {
      return next(new ErrorResponse('Not authorized to view this visit', 403));
    } else if (req.user.role === USER_ROLES.PATIENT) {
      const self = await Patient.findOne({ user: req.user._id });
      if (!self || String(self._id) !== String(patient._id)) {
        return next(new ErrorResponse('Not authorized to view this visit', 403));
      }
    } else {
      return next(new ErrorResponse('Not authorized', 403));
    }

    res.status(200).json({ success: true, data: visit });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a visit
// @route   PUT /api/v1/visits/:id
// @access  Private (Staff, Hospital Admin)
exports.updateVisit = async (req, res, next) => {
  try {
    const visit = await Visit.findById(req.params.id);
    if (!visit) return next(new ErrorResponse('Visit not found', 404));

    if (
      (req.user.role === USER_ROLES.HOSPITAL_ADMIN || req.user.role === USER_ROLES.STAFF) &&
      String(visit.hospital) !== String(req.user.hospital)
    ) {
      return next(new ErrorResponse('Not authorized to update this visit', 403));
    }

    if (req.user.role === USER_ROLES.PATIENT) {
      return next(new ErrorResponse('Patients cannot update visit records', 403));
    }

    const updates = { ...req.body };

    if (updates.visitType && !VISIT_TYPES.includes(updates.visitType)) {
      return next(new ErrorResponse(`Invalid visit type: ${updates.visitType}`, 400));
    }

    const updatedVisit = await Visit.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    await logService.logActivity(req.user._id, req.user.role, `Updated visit ${req.params.id}`, 'Visit', req.params.id);

    res.status(200).json({ success: true, data: updatedVisit });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a visit
// @route   DELETE /api/v1/visits/:id
// @access  Private (Staff, Hospital Admin)
exports.deleteVisit = async (req, res, next) => {
  try {
    const visit = await Visit.findById(req.params.id);
    if (!visit) return next(new ErrorResponse('Visit not found', 404));

    if (
      (req.user.role === USER_ROLES.HOSPITAL_ADMIN || req.user.role === USER_ROLES.STAFF) &&
      String(visit.hospital) !== String(req.user.hospital)
    ) {
      return next(new ErrorResponse('Not authorized to delete this visit', 403));
    }

    if (req.user.role === USER_ROLES.PATIENT) {
      return next(new ErrorResponse('Patients cannot delete visit records', 403));
    }

    await visit.deleteOne();

    await logService.logActivity(req.user._id, req.user.role, `Deleted visit ${req.params.id}`, 'Visit', req.params.id);

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
