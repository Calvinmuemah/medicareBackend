const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { USER_ROLES } = require('../utils/constants');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: Object.values(USER_ROLES),
    default: USER_ROLES.PATIENT,
  },
  hospital: {
    type: mongoose.Schema.ObjectId,
    ref: 'Hospital',
    required: function () {
      // Hospital is required for HOSPITAL_ADMIN, STAFF, and PATIENT roles
      return [USER_ROLES.HOSPITAL_ADMIN, USER_ROLES.STAFF, USER_ROLES.PATIENT].includes(this.role);
    },
  },
  specialty: {
    type: String,
    enum: ['General Practitioner', 'Obstetrician', 'Nurse', 'Midwife', 'Other'],
    required: function () {
      // Specialty is required only for STAFF role
      return this.role === USER_ROLES.STAFF;
    },
    default: 'Other',
  },
  // --- ADDED phoneNumber FIELD ---
  phoneNumber: {
    type: String,
    // Phone number is required for STAFF and PATIENT roles if present
    required: function() {
      return [USER_ROLES.STAFF, USER_ROLES.PATIENT].includes(this.role);
    },
    match: [
      /^\+\d{10,}$/, // Basic validation for E.164 format: starts with +, then at least 10 digits
      'Please add a valid phone number in international format (e.g., +2547XXXXXXXX)'
    ],
    trim: true,
    // unique: true, // Typically not unique for users, as family members might share, or users might have multiple accounts (less common)
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
  // Only hash if the password has been modified (or is new)
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);