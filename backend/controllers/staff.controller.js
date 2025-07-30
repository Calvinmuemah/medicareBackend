// controllers/staff.controller.js
// --- Manages Hospital Staff (Doctors/Nurses) ---

const User = require("../models/User");
const Hospital = require("../models/Hospital");
const ErrorResponse = require("../utils/errorResponse");
const { USER_ROLES, STAFF_SPECIALTIES } = require("../utils/constants");
const logService = require("../services/log.service");
const { generateRandomPassword } = require("../utils/passwordGenerator"); // Import password generator
const notificationService = require("../services/notification.service"); // Import notification service

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
  const { name, email, specialty, phoneNumber } = req.body; // Removed 'password', added 'phoneNumber'

  try {
    // Only Hospital Admins can add staff to *their* hospital
    if (
      !isHospitalAdmin(req.user) ||
      String(req.user.hospital) !== hospitalId
    ) {
      return next(
        new ErrorResponse("Not authorized to add staff to this hospital", 403)
      );
    }

    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return next(
        new ErrorResponse(`No hospital found with ID ${hospitalId}`, 404)
      );
    }

    // Validate specialty if provided
    if (specialty && !STAFF_SPECIALTIES.includes(specialty)) {
      return next(new ErrorResponse(`Invalid specialty: ${specialty}`, 400));
    }

    // Validate email and phone number
    if (!email) {
      return next(
        new ErrorResponse("Please provide an email for the staff member", 400)
      );
    }
    if (phoneNumber && !/^\+\d{10,}$/.test(phoneNumber)) {
      return next(
        new ErrorResponse(
          "Staff phone number must be in international format (e.g., +2547XXXXXXXX) and at least 10 digits",
          400
        )
      );
    }

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(
        new ErrorResponse(`User with email '${email}' already exists`, 400)
      );
    }

    // --- Generate a temporary password ---
    const tempPassword = generateRandomPassword();
    // The User model's pre-save hook should hash this password automatically

    const staffUser = await User.create({
      name,
      email,
      password: tempPassword, // Use the generated temporary password
      role: USER_ROLES.STAFF,
      hospital: hospitalId,
      specialty: specialty || "Other", // Default to 'Other' if not provided
      phoneNumber: phoneNumber, // Add phone number to the User model if it exists
      // Consider adding `passwordResetRequired: true` here to force password change on first login
    });

    // --- Send the temporary password to the staff member ---
    const subject = "Welcome to MHAAS! Your Staff Account Details";
    const emailBody = `Dear ${name},

Welcome to the MHAAS system as a staff member of ${hospital.name}!

Your account has been successfully created.
Here are your login details:
  - Email: ${email}
  - Password: ${tempPassword}

Please log in at [YOUR_LOGIN_URL_HERE] and change your password immediately for security reasons.

If you have any questions, please do not hesitate to contact your hospital administrator.

Sincerely,
The MHAAS Team`;

    const smsBody = `Welcome to MHAAS, ${name}! Your  password is: ${tempPassword}. Login at [YOUR_LOGIN_URL_HERE] and change it.`;

    // Attempt to send email
    const emailSendResult = await notificationService.sendEmail(
      email,
      subject,
      emailBody
    );
    if (!emailSendResult.success) {
      console.error(
        `[Staff Controller] Failed to send email to ${email}:`,
        emailSendResult.error
      );
      // Log error, but don't block staff creation if email sending fails
    }

    // Attempt to send SMS if phoneNumber is provided
    if (phoneNumber) {
      const smsSendResult = await notificationService.sendSMS(
        phoneNumber,
        smsBody
      );
      if (!smsSendResult.success) {
        console.error(
          `[Staff Controller] Failed to send SMS to ${phoneNumber}:`,
          smsSendResult.error
        );
        // Log error, but don't block staff creation if SMS sending fails
      }
    }

    await logService.logActivity(
      req.user._id,
      req.user.role,
      `Added staff member ${staffUser.name} to hospital ${hospital.name} and sent temporary password.`,
      "User",
      staffUser._id
    );

    res.status(201).json({
      success: true,
      message:
        "Staff member added successfully and temporary password sent to their email/phone (if provided).",
      data: staffUser,
    });
  } catch (err) {
    console.error("Error adding staff member:", err);
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
      return next(
        new ErrorResponse("Not authorized to view staff for this hospital", 403)
      );
    }

    const staff = await User.find({
      hospital: hospitalId,
      role: USER_ROLES.STAFF,
    }).populate("hospital", "name");

    res.status(200).json({
      success: true,
      count: staff.length,
      data: staff,
    });
  } catch (err) {
    console.error("Error getting hospital staff:", err);
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
      return next(
        new ErrorResponse(`No staff member found with ID ${req.params.id}`, 404)
      );
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
      return next(
        new ErrorResponse("Not authorized to view this staff member", 403)
      );
    }

    res.status(200).json({ success: true, data: staff });
  } catch (err) {
    console.error("Error getting staff member:", err);
    next(err);
  }
};

/**
 * @desc    Update a staff member's details
 * @route   PUT /api/v1/staff/:id
 * @access  Private (Super Admin, Hospital Admin of same hospital, Staff themselves)
 */
exports.updateStaff = async (req, res, next) => {
  const { name, email, specialty, phoneNumber } = req.body; // Added phoneNumber

  try {
    let staff = await User.findById(req.params.id);

    if (!staff || staff.role !== USER_ROLES.STAFF) {
      return next(
        new ErrorResponse(`No staff member found with ID ${req.params.id}`, 404)
      );
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
      return next(
        new ErrorResponse("Not authorized to update this staff member", 403)
      );
    }

    // Prevent changing role or hospital via this endpoint
    if (req.body.role || req.body.hospital) {
      return next(
        new ErrorResponse(
          "Cannot change role or hospital via this endpoint",
          400
        )
      );
    }

    if (specialty && !STAFF_SPECIALTIES.includes(specialty)) {
      return next(new ErrorResponse(`Invalid specialty: ${specialty}`, 400));
    }

    // Validate phoneNumber if provided in update
    if (phoneNumber && !/^\+\d{10,}$/.test(phoneNumber)) {
      return next(
        new ErrorResponse(
          "Staff phone number must be in international format (e.g., +2547XXXXXXXX) and at least 10 digits",
          400
        )
      );
    }

    staff = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, specialty, phoneNumber }, // Include phoneNumber in update
      { new: true, runValidators: true }
    );

    await logService.logActivity(
      req.user._id,
      req.user.role,
      `Updated staff member: ${staff.name}`,
      "User",
      staff._id
    );

    res.status(200).json({ success: true, data: staff });
  } catch (err) {
    console.error("Error updating staff member:", err);
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
      return next(
        new ErrorResponse(`No staff member found with ID ${req.params.id}`, 404)
      );
    }

    const sameHospital = String(staff.hospital) === String(req.user.hospital);
    const isSelf = String(staff._id) === String(req.user._id);

    if (!isSuperAdmin(req.user) && !isHospitalAdmin(req.user)) {
      return next(
        new ErrorResponse("Not authorized to delete this staff member", 403)
      );
    }

    if (isHospitalAdmin(req.user) && !sameHospital) {
      return next(
        new ErrorResponse(
          "Not authorized to delete staff from another hospital",
          403
        )
      );
    }

    if (isSelf) {
      return next(
        new ErrorResponse("Cannot delete your own staff account", 400)
      );
    }

    await staff.deleteOne();

    await logService.logActivity(
      req.user._id,
      req.user.role,
      `Deleted staff member: ${staff.name}`,
      "User",
      staff._id
    );

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    console.error("Error deleting staff member:", err);
    next(err);
  }
};
