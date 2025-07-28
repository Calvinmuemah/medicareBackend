const Patient = require('../models/Patient');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const { USER_ROLES } = require('../utils/constants');
const logService = require('../services/log.service');
const notificationService = require('../services/notification.service')
const { generateRandomPassword } = require('../utils/passwordGenerator');

// --- Register a New Patient ---
// @route   POST /api/v1/patients
// @access  Private (Staff only)
exports.registerPatient = async (req, res, next) => {
  const {
    name, // This will be the user's name for the User model, typically the patient's full name
    email,
    // password - REMOVED from destructuring; we will generate it
    // Patient-specific details from the schema
    fullName, // Patient's actual full name as per schema
    phoneNumber, // Patient's primary contact phone number
    nationalIdClinicId,
    dateOfBirth,
    bloodGroup,
    maritalStatus,
    nextOfKinName,
    nextOfKinContact,
    locationVillage,
    languagePreference,
    pregnancyStatus,
    lmp,
    gravida,
    parity,
    knownConditions,
    allergies,
    emergencyContactName,
    emergencyContactPhone,
  } = req.body;

  try {
    // Authorization check: Only staff members can register new patients
    if (req.user.role !== USER_ROLES.STAFF) {
      return next(new ErrorResponse('Only staff members can register new patients', 403));
    }

    // --- Validation for fields ---
    if (!fullName) {
      return next(new ErrorResponse('Please provide the patient\'s full name', 400));
    }
    if (!phoneNumber) {
      return next(new ErrorResponse('Please provide the patient\'s phone number', 400));
    }
    // Basic phone number validation (at least 10 digits)
    if (!/^\d{10,}$/.test(phoneNumber)) {
      return next(new ErrorResponse('Patient phone number must be at least 10 digits', 400));
    }
    if (!email) { // Ensure email is provided if we're sending email notifications
      return next(new ErrorResponse('Please provide the patient\'s email address', 400));
    }
    if (!maritalStatus) {
      return next(new ErrorResponse('Please provide the patient\'s marital status', 400));
    }
    if (!['Single', 'Married', 'Other'].includes(maritalStatus)) {
      return next(new ErrorResponse('Invalid marital status provided. Must be Single, Married, or Other.', 400));
    }
    if (!locationVillage) {
      return next(new ErrorResponse('Please provide the patient\'s location or village', 400));
    }
    if (!pregnancyStatus) {
      return next(new ErrorResponse('Please provide the patient\'s pregnancy status', 400));
    }
    if (!['First pregnancy', 'Subsequent pregnancy'].includes(pregnancyStatus)) {
      return next(new ErrorResponse('Invalid pregnancy status provided. Must be "First pregnancy" or "Subsequent pregnancy".', 400));
    }
    if (!lmp) {
      return next(new ErrorResponse('Please provide the Last Menstrual Period (LMP)', 400));
    }

    const VALID_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (bloodGroup && !VALID_BLOOD_GROUPS.includes(bloodGroup)) {
      return next(new ErrorResponse('Invalid blood group provided', 400));
    }

    // Emergency contact phone validation (at least 10 digits)
    if (emergencyContactPhone && !/^\d{10,}$/.test(emergencyContactPhone)) {
      return next(new ErrorResponse('Emergency contact phone must be at least 10 digits', 400));
    }

    // Check if a user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorResponse(`User with email '${email}' already exists`, 400));
    }

    // --- Generate a temporary password ---
    const tempPassword = generateRandomPassword(); // Default length is 12

    // Create the patient's user account
    const patientUser = await User.create({
      name: fullName, // Use patient's fullName for the User's name
      email,
      password: tempPassword, // User model's pre-save hook will hash this
      role: USER_ROLES.PATIENT,
      hospital: req.user.hospital,
      // Consider adding `passwordResetRequired: true` to force password change on first login
      // passwordResetRequired: true,
    });

    // Create the patient profile with all details
    const patient = await Patient.create({
      user: patientUser._id,
      hospital: req.user.hospital,
      registeredBy: req.user._id,
      fullName,
      phoneNumber,
      nationalIdClinicId,
      dateOfBirth,
      bloodGroup,
      maritalStatus,
      emergencyContactName,
      emergencyContactPhone,
      nextOfKinName,
      nextOfKinContact,
      locationVillage,
      languagePreference,
      pregnancyStatus,
      lmp,
      gravida,
      parity,
      knownConditions,
      allergies,
    });

    // --- Send the temporary password to the patient via Email and SMS ---
    const subject = 'Welcome to MHAAS! Your Account Details';
    const emailBody = `Dear ${fullName},

Welcome to the MHAAS system!

Your account has been successfully created.
Here are your login details:
  - Email: ${email}
  - Temporary Password: ${tempPassword}

Please log in at [Your_Login_URL_Here] and change your password immediately for security reasons.

If you have any questions, please do not hesitate to contact us.

Sincerely,
The MHAAS Team`;

    const smsBody = `Welcome to MHAAS, ${fullName}! Your temporary password is: ${tempPassword}. Please login at [Your_Login_URL_Here] and change it.`;

    // Attempt to send email
    const emailResult = await notificationService.sendEmail(email, subject, emailBody);
    if (!emailResult.success) {
      console.error(`[Patient Controller] Failed to send email: ${emailResult.message}`);
      // Decide if this error should block registration or just be logged
    }

    // Attempt to send SMS
    const smsResult = await notificationService.sendSMS(phoneNumber, smsBody);
    if (!smsResult.success) {
      console.error(`[Patient Controller] Failed to send SMS: ${smsResult.message}`);
      // Decide if this error should block registration or just be logged
    }

    // Log the activity
    await logService.logActivity(
      req.user._id,
      req.user.role,
      `Registered new patient: ${patientUser.name} (ID: ${patient._id}) and sent temporary password.`,
      'Patient',
      patient._id
    );

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully and temporary password sent to their email/phone.',
      data: { patientUser, patient },
    });
  } catch (error) {
    console.error('Error registering patient:', error);
    next(error);
  }
};

// --- Get All Patients for a Hospital ---
// @route   GET /api/v1/hospitals/:hospitalId/patients
// @access  Private (Hospital Admin, Staff)
exports.getHospitalPatients = async (req, res, next) => {
  const { hospitalId } = req.params;

  try {
    // Authorization check
    const authorized =
      req.user.role === USER_ROLES.SUPER_ADMIN ||
      String(req.user.hospital) === hospitalId;

    if (!authorized) {
      return next(new ErrorResponse('Not authorized to view patients for this hospital', 403));
    }

    // Find patients belonging to the specified hospital
    const patients = await Patient.find({ hospital: hospitalId })
      .populate('user', 'name email') // Populate user details
      .populate('registeredBy', 'name'); // Populate staff who registered them

    res.status(200).json({
      success: true,
      count: patients.length,
      data: patients,
    });
  } catch (error) {
    console.error('Error getting hospital patients:', error);
    next(error);
  }
};

// --- Get a Single Patient ---
// @route   GET /api/v1/patients/:id
// @access  Private (Hospital Admin, Staff, Patient)
exports.getPatient = async (req, res, next) => {
  try {
    // Find the patient by ID and populate related user and hospital info
    const patient = await Patient.findById(req.params.id)
      .populate('user', 'name email role')
      .populate('hospital', 'name')
      .populate('registeredBy', 'name'); // Also populate who registered them

    if (!patient) {
      return next(new ErrorResponse(`No patient found with ID ${req.params.id}`, 404));
    }

    // Authorization logic:
    // 1. Staff/Admin: Must belong to the same hospital as the patient
    // 2. Patient: Can only view their own profile
    const isStaffOrAdmin = [USER_ROLES.HOSPITAL_ADMIN, USER_ROLES.STAFF].includes(req.user.role);
    const isSameHospital = String(patient.hospital) === String(req.user.hospital);
    const isPatientHimself = String(patient.user._id) === String(req.user._id);

    if (
      (isStaffOrAdmin && !isSameHospital) || // Staff/Admin not in the same hospital
      (req.user.role === USER_ROLES.PATIENT && !isPatientHimself) // Patient trying to view someone else's profile
    ) {
      return next(new ErrorResponse('Not authorized to view this patient', 403));
    }

    res.status(200).json({ success: true, data: patient });
  } catch (error) {
    console.error('Error getting patient:', error);
    next(error);
  }
};

// --- Update Patient Details ---
// @route   PUT /api/v1/patients/:id
// @access  Private (Hospital Admin, Staff)
exports.updatePatient = async (req, res, next) => {
  // Destructure all fields that can be updated
  const {
    fullName,
    phoneNumber,
    nationalIdClinicId,
    dateOfBirth,
    bloodGroup,
    maritalStatus,
    nextOfKinName,
    nextOfKinContact,
    locationVillage,
    languagePreference,
    dateOfFirstVisit, // Allow updating if needed
    pregnancyStatus,
    lmp,
    gravida,
    parity,
    knownConditions,
    allergies,
    latestVitals, // Allow updating the entire latestVitals object
    emergencyContactName,
    emergencyContactPhone,
  } = req.body;

  // Create an object with only the fields that are provided in the request body
  const updateFields = {};
  if (fullName !== undefined) updateFields.fullName = fullName;
  if (phoneNumber !== undefined) updateFields.phoneNumber = phoneNumber;
  if (nationalIdClinicId !== undefined) updateFields.nationalIdClinicId = nationalIdClinicId;
  if (dateOfBirth !== undefined) updateFields.dateOfBirth = dateOfBirth;
  if (bloodGroup !== undefined) updateFields.bloodGroup = bloodGroup;
  if (maritalStatus !== undefined) updateFields.maritalStatus = maritalStatus;
  if (nextOfKinName !== undefined) updateFields.nextOfKinName = nextOfKinName;
  if (nextOfKinContact !== undefined) updateFields.nextOfKinContact = nextOfKinContact;
  if (locationVillage !== undefined) updateFields.locationVillage = locationVillage;
  if (languagePreference !== undefined) updateFields.languagePreference = languagePreference;
  if (dateOfFirstVisit !== undefined) updateFields.dateOfFirstVisit = dateOfFirstVisit;
  if (pregnancyStatus !== undefined) updateFields.pregnancyStatus = pregnancyStatus;
  if (lmp !== undefined) updateFields.lmp = lmp;
  if (gravida !== undefined) updateFields.gravida = gravida;
  if (parity !== undefined) updateFields.parity = parity;
  if (knownConditions !== undefined) updateFields.knownConditions = knownConditions;
  if (allergies !== undefined) updateFields.allergies = allergies;
  if (emergencyContactName !== undefined) updateFields.emergencyContactName = emergencyContactName;
  if (emergencyContactPhone !== undefined) updateFields.emergencyContactPhone = emergencyContactPhone;

  // Special handling for nested objects like latestVitals
  if (latestVitals !== undefined) {
    // If latestVitals is provided, merge it with existing or replace
    // This assumes you want to update the *entire* latestVitals object
    // If you want to update individual sub-fields (e.g., just BP), you'd need more granular logic
    updateFields.latestVitals = { ...updateFields.latestVitals, ...latestVitals };
  }

  try {
    let patient = await Patient.findById(req.params.id).populate('user', 'name');

    if (!patient) {
      return next(new ErrorResponse(`No patient found with ID ${req.params.id}`, 404));
    }

    // Authorization check: Only Hospital Admin or Staff from the same hospital can update
    const isAuthorized =
      [USER_ROLES.HOSPITAL_ADMIN, USER_ROLES.STAFF].includes(req.user.role) &&
      String(patient.hospital) === String(req.user.hospital);

    if (!isAuthorized) {
      return next(new ErrorResponse('Not authorized to update this patient', 403));
    }

    // Prevent patients from updating their own details via this endpoint (they might have a separate profile update)
    if (req.user.role === USER_ROLES.PATIENT) {
      return next(new ErrorResponse('Patients cannot update their own details via this endpoint', 403));
    }

    // Perform the update
    patient = await Patient.findByIdAndUpdate(req.params.id, updateFields, {
      new: true, // Return the updated document
      runValidators: true, // Run Mongoose schema validators on update
    });

    // Log the activity
    await logService.logActivity(
      req.user._id,
      req.user.role,
      `Updated patient details for: ${patient.user.name} (ID: ${patient._id})`,
      'Patient',
      patient._id
    );

    res.status(200).json({ success: true, data: patient });
  } catch (error) {
    console.error('Error updating patient:', error);
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

    // Authorization check: Only Hospital Admin from the same hospital can delete
    const isAuthorized =
      req.user.role === USER_ROLES.HOSPITAL_ADMIN &&
      String(patient.hospital) === String(req.user.hospital);

    if (!isAuthorized) {
      return next(new ErrorResponse('Not authorized to delete this patient', 403));
    }

    // Delete the associated User account first
    await User.deleteOne({ _id: patient.user });
    // Then delete the Patient profile
    await patient.deleteOne(); // Using deleteOne() on the document instance

    // Log the activity
    await logService.logActivity(
      req.user._id,
      req.user.role,
      `Deleted patient and their user account (Patient ID: ${patient._id}, User ID: ${patient.user})`,
      'Patient',
      patient._id
    );

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleting patient:', error);
    next(error);
  }
};