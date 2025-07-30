// --- Manages Hospital and Hospital Admin Creation ---
const Hospital = require('../models/Hospital');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const { USER_ROLES } = require('../utils/constants');
const logService = require('../services/log.service');
const { generateRandomPassword } = require('../utils/passwordGenerator'); // Import password generator
const notificationService = require('../services/notification.service'); 

// @desc    Onboard a new hospital
// @route   POST /api/v1/hospitals
// @access  Private (Super Admin only)

// @desc    Onboard a new hospital
// @route   POST /api/v1/hospitals
// @access  Private (Super Admin only)
exports.onboardHospital = async (req, res, next) => {
  const { name, address, phone, email, description } = req.body; // Assuming 'phone' and 'email' for the hospital itself

  try {
    // Basic validation for hospital onboarding
    if (!name || !address || !phone || !email) {
      return next(new ErrorResponse('Please provide name, address, phone, and email for the hospital', 400));
    }
    if (!/^\+\d{10,}$/.test(phone)) {
      return next(new ErrorResponse('Hospital phone number must be in international format (e.g., +2547XXXXXXXX) and at least 10 digits', 400));
    }
    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      return next(new ErrorResponse('Please add a valid email for the hospital', 400));
    }

    const existingHospital = await Hospital.findOne({ name });
    if (existingHospital) {
      return next(new ErrorResponse(`Hospital with name '${name}' already exists`, 400));
    }

    const hospital = await Hospital.create({ name, address, phone, email, description });

    // --- Send onboarding confirmation to the hospital's contact email/phone ---
    const subject = `Welcome to MHAAS! Hospital Onboarding Confirmation for ${hospital.name}`;
    const emailBody = `Dear ${hospital.name} Team,

Welcome to the MHAAS system! Your hospital has been successfully onboarded.

Details:
  - Name: ${hospital.name}
  - Address: ${hospital.address}
  - Contact Email: ${hospital.email}
  - Contact Phone: ${hospital.phone}

We are excited to have you on board. You can now proceed to add hospital administrators and staff.

Sincerely,
The MHAAS Team`;

    const smsBody = `MHAAS: ${hospital.name} has been successfully onboarded. Welcome!`;

    // Attempt to send email
    const emailSendResult = await notificationService.sendEmail(hospital.email, subject, emailBody);
    if (!emailSendResult.success) {
      console.error(`[Hospital Controller] Failed to send onboarding email to ${hospital.email}:`, emailSendResult.error);
    }

    // Attempt to send SMS to the hospital's phone number
    const smsSendResult = await notificationService.sendSMS(hospital.phone, smsBody);
    if (!smsSendResult.success) {
      console.error(`[Hospital Controller] Failed to send onboarding SMS to ${hospital.phone}:`, smsSendResult.error);
    }

    await logService.logActivity(
      req.user._id,
      req.user.role,
      `Onboarded new hospital: ${hospital.name} and sent onboarding notification.`,
      'Hospital',
      hospital._id
    );

    res.status(201).json({ success: true, message: 'Hospital onboarded successfully and notification sent.', data: hospital });
  } catch (err) {
    console.error('Error onboarding hospital:', err);
    next(err);
  }
};

// @desc    Add a hospital admin for a hospital
// @route   POST /api/v1/hospitals/:hospitalId/admin
// @access  Private (Super Admin only)

exports.addHospitalAdmin = async (req, res, next) => {
  const { hospitalId } = req.params;
  const { name, email, phoneNumber } = req.body; // Removed 'password', added 'phoneNumber'

  try {
    // Only Super Admins can add hospital admins
    if (req.user.role !== USER_ROLES.SUPER_ADMIN) {
      return next(new ErrorResponse('Not authorized to add hospital administrators', 403));
    }

    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return next(new ErrorResponse(`No hospital found with ID ${hospitalId}`, 404));
    }

    // Validate email and phone number for the admin
    if (!email) {
      return next(new ErrorResponse('Please provide an email for the hospital admin', 400));
    }
    if (phoneNumber && !/^\+\d{10,}$/.test(phoneNumber)) {
      return next(new ErrorResponse('Admin phone number must be in international format (e.g., +2547XXXXXXXX) and at least 10 digits', 400));
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorResponse(`User with email '${email}' already exists`, 400));
    }

    // --- Generate a temporary password for the admin ---
    const tempPassword = generateRandomPassword();

    const adminUser = await User.create({
      name,
      email,
      password: tempPassword, // Use the generated temporary password
      role: USER_ROLES.HOSPITAL_ADMIN,
      hospital: hospitalId,
      phoneNumber: phoneNumber, // Add phone number to the User model
      // Consider adding `passwordResetRequired: true` here
    });

    // --- Send temporary password to the new hospital admin ---
    const subject = `Welcome to MHAAS! Your Hospital Admin Account Details for ${hospital.name}`;
    const emailBody = `Dear ${name},

Welcome to the MHAAS system! You have been set up as a Hospital Administrator for ${hospital.name}.

Here are your login details:
  - Email: ${email}
  - Temporary Password: ${tempPassword}

Please log in at [YOUR_LOGIN_URL_HERE] and change your password immediately for security reasons.

If you have any questions, please contact the Super Admin.

Sincerely,
The MHAAS Team`;

    const smsBody = `Welcome to MHAAS, ${name}! Your temp password for ${hospital.name} admin account is: ${tempPassword}. Login at [YOUR_LOGIN_URL_HERE] and change it.`;

    // Attempt to send email
    const emailSendResult = await notificationService.sendEmail(email, subject, emailBody);
    if (!emailSendResult.success) {
      console.error(`[Hospital Controller] Failed to send admin email to ${email}:`, emailSendResult.error);
    }

    // Attempt to send SMS if phoneNumber is provided
    if (phoneNumber) {
      const smsSendResult = await notificationService.sendSMS(phoneNumber, smsBody);
      if (!smsSendResult.success) {
        console.error(`[Hospital Controller] Failed to send admin SMS to ${phoneNumber}:`, smsSendResult.error);
      }
    }

    await logService.logActivity(
      req.user._id,
      req.user.role,
      `Added hospital admin ${adminUser.name} to hospital ${hospital.name} and sent temporary password.`,
      'User',
      adminUser._id
    );

    res.status(201).json({
      success: true,
      message: 'Hospital admin added successfully and temporary password sent.',
      data: adminUser
    });
  } catch (err) {
    console.error('Error adding hospital admin:', err);
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
