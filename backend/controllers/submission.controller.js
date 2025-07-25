const Submission = require('../models/Submission');
const Patient = require('../models/Patient');
const ErrorResponse = require('../utils/errorResponse');
const { USER_ROLES, SUBMISSION_TYPES } = require('../utils/constants');
const logService = require('../services/log.service');

// Utility: find patient by user ID
const getPatientByUser = async (userId) => {
  return await Patient.findOne({ user: userId });
};

// Utility: check role
const isRole = (user, roles) => roles.includes(user.role);

// Utility: check hospital match
const isSameHospital = (a, b) => String(a) === String(b);

// @desc    Create a new patient submission (audio/text)
// @route   POST /api/v1/me/submit
// @access  Private (Patient only)
exports.createSubmission = async (req, res, next) => {
  try {
    if (req.user.role !== USER_ROLES.PATIENT) {
      return next(new ErrorResponse('Only patients can submit records', 403));
    }

    const patient = await getPatientByUser(req.user._id);
    if (!patient) return next(new ErrorResponse('Patient profile not found', 404));

    const { type, content, fileUrl } = req.body;

    if (!type || !SUBMISSION_TYPES.includes(type)) {
      return next(new ErrorResponse('Invalid or missing submission type ("audio" or "text")', 400));
    }

    if (type === 'text' && !content) {
      return next(new ErrorResponse('Text content is required', 400));
    }

    if (type === 'audio' && !fileUrl) {
      return next(new ErrorResponse('Audio file URL is required', 400));
    }

    const submission = await Submission.create({
      patient: patient._id,
      hospital: patient.hospital,
      type,
      content,
      fileUrl,
    });

    await logService.logActivity(req.user._id, req.user.role, `Submitted a ${type} record`, 'Submission', submission._id);

    res.status(201).json({ success: true, data: submission });
  } catch (error) {
    next(error);
  }
};

// @desc    Get patient's own submissions
// @route   GET /api/v1/me/submissions
// @access  Private (Patient only)
exports.getMySubmissions = async (req, res, next) => {
  try {
    if (req.user.role !== USER_ROLES.PATIENT) {
      return next(new ErrorResponse('Not authorized', 403));
    }

    const patient = await getPatientByUser(req.user._id);
    if (!patient) return next(new ErrorResponse('Patient profile not found', 404));

    const submissions = await Submission.find({ patient: patient._id }).sort({ submittedAt: -1 });

    res.status(200).json({ success: true, count: submissions.length, data: submissions });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all submissions for a hospital
// @route   GET /api/v1/hospitals/:hospitalId/submissions
// @access  Private (Hospital Admin, Staff)
exports.getHospitalSubmissions = async (req, res, next) => {
  const { hospitalId } = req.params;

  try {
    if (!isSameHospital(req.user.hospital, hospitalId) && req.user.role !== USER_ROLES.SUPER_ADMIN) {
      return next(new ErrorResponse('Not authorized for this hospital', 403));
    }

    const submissions = await Submission.find({ hospital: hospitalId })
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'name email',
        },
      })
      .sort({ submittedAt: -1 });

    res.status(200).json({ success: true, count: submissions.length, data: submissions });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single submission
// @route   GET /api/v1/submissions/:id
// @access  Private (Hospital Admin, Staff, Patient, Super Admin)
exports.getSubmission = async (req, res, next) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'name email' },
      });

    if (!submission) return next(new ErrorResponse('Submission not found', 404));

    const { user } = req;

    if (user.role === USER_ROLES.SUPER_ADMIN) {
      // Full access
    } else if ([USER_ROLES.HOSPITAL_ADMIN, USER_ROLES.STAFF].includes(user.role)) {
      if (!isSameHospital(submission.hospital, user.hospital)) {
        return next(new ErrorResponse('Not authorized for this submission', 403));
      }
    } else if (user.role === USER_ROLES.PATIENT) {
      const patient = await getPatientByUser(user._id);
      if (!patient || String(submission.patient._id) !== String(patient._id)) {
        return next(new ErrorResponse('Not authorized to view this submission', 403));
      }
    } else {
      return next(new ErrorResponse('Not authorized', 403));
    }

    res.status(200).json({ success: true, data: submission });
  } catch (error) {
    next(error);
  }
};

// @desc    Update submission notes
// @route   PUT /api/v1/submissions/:id
// @access  Private (Hospital Admin, Staff)
exports.updateSubmissionNotes = async (req, res, next) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) return next(new ErrorResponse('Submission not found', 404));

    const { user } = req;
    if (user.role === USER_ROLES.PATIENT) {
      return next(new ErrorResponse('Patients cannot update submissions', 403));
    }

    if (![USER_ROLES.HOSPITAL_ADMIN, USER_ROLES.STAFF].includes(user.role) || !isSameHospital(submission.hospital, user.hospital)) {
      return next(new ErrorResponse('Not authorized to update this submission', 403));
    }

    submission.notes = req.body.notes;
    await submission.save();

    await logService.logActivity(user._id, user.role, `Updated notes for submission ${submission._id}`, 'Submission', submission._id);

    res.status(200).json({ success: true, data: submission });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a submission
// @route   DELETE /api/v1/submissions/:id
// @access  Private (Hospital Admin, Staff)
exports.deleteSubmission = async (req, res, next) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) return next(new ErrorResponse('Submission not found', 404));

    const { user } = req;
    if (user.role === USER_ROLES.PATIENT) {
      return next(new ErrorResponse('Patients cannot delete submissions', 403));
    }

    if (![USER_ROLES.HOSPITAL_ADMIN, USER_ROLES.STAFF].includes(user.role) || !isSameHospital(submission.hospital, user.hospital)) {
      return next(new ErrorResponse('Not authorized to delete this submission', 403));
    }

    await submission.deleteOne();

    await logService.logActivity(user._id, user.role, `Deleted submission ${req.params.id}`, 'Submission', req.params.id);

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
