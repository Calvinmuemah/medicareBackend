const Reminder = require('../models/Reminder');
const Patient = require('../models/Patient');
const ErrorResponse = require('../utils/errorResponse');
const { USER_ROLES, REMINDER_TYPES } = require('../utils/constants');
const notificationService = require('../services/notification.service');
const logService = require('../services/log.service');

// --- Helper Functions ---
const isStaff = (user) => user.role === USER_ROLES.STAFF;
const isHospitalAdmin = (user) => user.role === USER_ROLES.HOSPITAL_ADMIN;
const isSuperAdmin = (user) => user.role === USER_ROLES.SUPER_ADMIN;
const isPatient = (user) => user.role === USER_ROLES.PATIENT;

const populateReminder = (query) => 
  query
    .populate({
      path: 'patient',
      populate: { path: 'user', select: 'name email phone' },
    })
    .populate('createdBy', 'name email');

// --- Create Reminder ---
exports.createReminder = async (req, res, next) => {
  const { patientId, type, message, scheduledTime } = req.body;

  try {
    if (!isStaff(req.user)) {
      return next(new ErrorResponse('Only staff members can create reminders', 403));
    }

    const patient = await Patient.findById(patientId).populate('user', 'name email phone');
    if (!patient) return next(new ErrorResponse(`No patient found with ID ${patientId}`, 404));
    if (String(patient.hospital) !== String(req.user.hospital)) {
      return next(new ErrorResponse('Cannot create reminder for patient outside your hospital', 403));
    }

    if (type && !REMINDER_TYPES.includes(type)) {
      return next(new ErrorResponse(`Invalid reminder type: ${type}`, 400));
    }

    const reminder = await Reminder.create({
      patient: patientId,
      hospital: req.user.hospital,
      type: type || 'Other',
      message,
      scheduledTime: scheduledTime ? new Date(scheduledTime) : Date.now(),
      createdBy: req.user._id,
      sent: false,
    });

    // Send immediately if scheduledTime is now or in the past
    if (!scheduledTime || new Date(scheduledTime) <= Date.now()) {
      const phone = patient.user.phone;
      if (!phone) {
        console.warn(`No phone number for patient ${patient.user.name}`);
      } else {
        const result = await notificationService.sendSMS(
          phone,
          `MHAAS Reminder for ${patient.user.name}: ${message}`
        );

        if (result.success) {
          reminder.sent = true;
          reminder.sentAt = Date.now();
          await reminder.save();
        } else {
          console.warn(`Failed to send SMS: ${result.message}`);
        }
      }
    }

    await logService.logActivity(
      req.user._id,
      req.user.role,
      `Created reminder for ${patient.user.name}`,
      'Reminder',
      reminder._id
    );

    res.status(201).json({
      success: true,
      data: reminder,
      message: reminder.sent
        ? 'Reminder created and sent immediately.'
        : 'Reminder created and scheduled for later.',
    });
  } catch (error) {
    next(error);
  }
};

// --- Get All Reminders ---
exports.getReminders = async (req, res, next) => {
  try {
    let query;

    if (isSuperAdmin(req.user)) {
      query = Reminder.find();
    } else if (isHospitalAdmin(req.user) || isStaff(req.user)) {
      query = Reminder.find({ hospital: req.user.hospital });
    } else if (isPatient(req.user)) {
      const patient = await Patient.findOne({ user: req.user._id });
      if (!patient) return next(new ErrorResponse('Patient profile not found', 404));
      query = Reminder.find({ patient: patient._id });
    } else {
      return next(new ErrorResponse('Not authorized to view reminders', 403));
    }

    const reminders = await populateReminder(query);
    res.status(200).json({ success: true, count: reminders.length, data: reminders });
  } catch (error) {
    next(error);
  }
};

// --- Get Single Reminder ---
exports.getReminder = async (req, res, next) => {
  try {
    const reminder = await populateReminder(Reminder.findById(req.params.id));
    if (!reminder) return next(new ErrorResponse(`No reminder found with ID ${req.params.id}`, 404));

    if (isSuperAdmin(req.user)) {
      // allowed
    } else if (isHospitalAdmin(req.user) || isStaff(req.user)) {
      if (String(reminder.hospital) !== String(req.user.hospital)) {
        return next(new ErrorResponse('Not authorized to view this reminder', 403));
      }
    } else if (isPatient(req.user)) {
      const patient = await Patient.findOne({ user: req.user._id });
      if (!patient || String(reminder.patient._id) !== String(patient._id)) {
        return next(new ErrorResponse('Not authorized to view this reminder', 403));
      }
    } else {
      return next(new ErrorResponse('Not authorized to view reminders', 403));
    }

    res.status(200).json({ success: true, data: reminder });
  } catch (error) {
    next(error);
  }
};

// --- Update Reminder ---
exports.updateReminder = async (req, res, next) => {
  const { message, scheduledTime, sent } = req.body;

  try {
    let reminder = await Reminder.findById(req.params.id);
    if (!reminder) return next(new ErrorResponse(`No reminder found with ID ${req.params.id}`, 404));

    if ((isHospitalAdmin(req.user) || isStaff(req.user)) && String(reminder.hospital) !== String(req.user.hospital)) {
      return next(new ErrorResponse('Not authorized to update this reminder', 403));
    }
    if (isPatient(req.user)) {
      return next(new ErrorResponse('Patients cannot update reminders', 403));
    }

    const updateFields = {};
    if (message) updateFields.message = message;
    if (scheduledTime) updateFields.scheduledTime = new Date(scheduledTime);
    if (typeof sent === 'boolean') {
      updateFields.sent = sent;
      if (sent) updateFields.sentAt = Date.now();
    }

    reminder = await Reminder.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true,
    });

    await logService.logActivity(
      req.user._id,
      req.user.role,
      `Updated reminder ${reminder._id}`,
      'Reminder',
      reminder._id
    );

    res.status(200).json({ success: true, data: reminder });
  } catch (error) {
    next(error);
  }
};

// --- Delete Reminder ---
exports.deleteReminder = async (req, res, next) => {
  try {
    const reminder = await Reminder.findById(req.params.id);
    if (!reminder) return next(new ErrorResponse(`No reminder found with ID ${req.params.id}`, 404));

    if ((isHospitalAdmin(req.user) || isStaff(req.user)) && String(reminder.hospital) !== String(req.user.hospital)) {
      return next(new ErrorResponse('Not authorized to delete this reminder', 403));
    }
    if (isPatient(req.user)) {
      return next(new ErrorResponse('Patients cannot delete reminders', 403));
    }

    await reminder.deleteOne();

    await logService.logActivity(
      req.user._id,
      req.user.role,
      `Deleted reminder ${req.params.id}`,
      'Reminder',
      req.params.id
    );

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
