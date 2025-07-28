const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  // --- Core Patient-User and Hospital Link ---
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // Ensures one patient profile per user account
  },
  hospital: {
    type: mongoose.Schema.ObjectId,
    ref: 'Hospital',
    required: true,
  },
  registeredBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User', // Refers to the staff user who registered the patient
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },

  // --- Step 1: Personal Details ---
  fullName: {
    type: String,
    required: [true, 'Please add the patient\'s full name'],
    trim: true, // Removes whitespace from both ends of a string
  },
  phoneNumber: {
    type: String,
    required: [true, 'Please add the patient\'s phone number for SMS reminders'],
    // Optional: Add regex for Kenyan phone numbers for stricter validation
    // match: /^(?:254|\+254|0)?(7(?:(?:[0-9][0-9])|(?:[1][0-9])|(?:[2][0-9])|(?:[3][0-9])|(?:[4][0-9])|(?:[5][0-9])|(?:[6][0-9])|(?:[7][0-9])|(?:[8][0-9])|(?:[9][0-9]))[0-9]{6})$/
  },
  nationalIdClinicId: { // Renamed from "National ID / Clinic ID" for camelCase
    type: String,
    trim: true,
    // You might add unique: true here if clinic IDs are always unique,
    // but national IDs might not be required for all patients, so leave as is.
  },
  dateOfBirth: { // Aligns with 'Age or Date of Birth' and is a core piece of info
    type: Date,
    required: [true, 'Please add patient date of birth'],
  },
  bloodGroup: { // Retained from initial schema, good to have
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  },
  maritalStatus: {
    type: String,
    enum: ['Single', 'Married', 'Other'],
    required: [true, 'Please select marital status'], // Changed to required based on your table
  },
  emergencyContactName: { // From initial schema, good to retain as a primary emergency contact
    type: String,
    required: [true, 'Please add emergency contact name'],
    trim: true,
  },
  emergencyContactPhone: { // From initial schema, good to retain
    type: String,
    required: [true, 'Please add emergency contact phone'],
  },
  nextOfKinName: { // Added based on your "Step 1" table
    type: String,
    trim: true,
  },
  nextOfKinContact: { // Added based on your "Step 1" table
    type: String,
  },
  locationVillage: { // Renamed from "Location / Village" for camelCase
    type: String,
    required: [true, 'Please add the patient\'s location or village'],
    trim: true,
  },
  languagePreference: {
    type: String,
    enum: ['English', 'Kiswahili', 'Other'], // As per your dropdown
    default: 'English', // Sensible default
  },
  dateOfFirstVisit: {
    type: Date,
    default: Date.now, // Auto-filled when the patient record is created
  },
  pregnancyStatus: {
    type: String,
    enum: ['First pregnancy', 'Subsequent pregnancy'],
    required: [true, 'Please specify pregnancy status'],
  },

  // --- Step 2: Health Information ---
  lmp: { // Last Menstrual Period - Required for EDD
    type: Date,
    required: [true, 'Please add the Last Menstrual Period (LMP) for EDD calculation'],
  },
  edd: { // Estimated Due Date - Auto-calculated based on LMP
    type: Date,
    required: [true, 'Please add estimated due date'], // Still required, but will be set by pre-save hook
  },
  gravida: { // Number of pregnancies (total)
    type: Number,
    min: 0,
    default: 0, // Sensible default
  },
  parity: { // Number of live births
    type: Number,
    min: 0,
    default: 0, // Sensible default
  },
  knownConditions: {
    type: [String], // Array of strings for conditions like 'Diabetes', 'Hypertension', 'HIV', 'Asthma'
  },
  allergies: {
    type: String, // As per your table, a single text field for all allergies
    // If you need structured allergies (e.g., drug allergies, food allergies), consider an array of objects
    // Example: [{ type: String, description: String }]
  },

  // --- Vital Signs & Measurements ---
  // This object will store the most recent readings.
  // For historical vital signs, a separate sub-document array or collection would be more appropriate.
  latestVitals: {
    bloodPressure: {
      systolic: Number, // Top number (e.g., 120)
      diastolic: Number, // Bottom number (e.g., 80)
      recordedAt: Date, // When this specific BP reading was taken
    },
    fetalHeartRate: { // If applicable to a pregnant patient
      type: Number, // Beats Per Minute (BPM)
      recordedAt: Date,
    },
    weight: {
      type: Number, // in kg
      recordedAt: Date,
    },
    height: {
      type: Number, // in cm
      recordedAt: Date,
    },
    bmi: { // Body Mass Index - Auto-calculated
      type: Number,
      recordedAt: Date,
    },
    temperature: {
      type: Number, // in Celsius or Fahrenheit, depending on standard used
      recordedAt: Date,
    },
    muac: { // Mid-Upper Arm Circumference, used for malnutrition screening
      type: Number, // in cm
      recordedAt: Date,
    },
  },
});

// --- Mongoose Middleware (Pre-save Hooks) ---
PatientSchema.pre('save', async function (next) {
  // 1. Validate User Role: Ensure the associated 'user' has the 'patient' role
  const user = await mongoose.model('User').findById(this.user);
  if (!user || user.role !== 'patient') {
    return next(new Error('Associated user must have a "patient" role.'));
  }

  // 2. Auto-calculate EDD (Estimated Due Date) if LMP is provided or modified
  // Naegele's Rule: Add 7 days to LMP, subtract 3 months, add 1 year
  // This is a common method, but confirm with medical professionals for precision.
  if (this.isModified('lmp') && this.lmp) {
    const lmpDate = new Date(this.lmp);
    // Adjusting for Naegele's Rule
    lmpDate.setDate(lmpDate.getDate() + 7);
    lmpDate.setMonth(lmpDate.getMonth() - 3);
    lmpDate.setFullYear(lmpDate.getFullYear() + 1);
    this.edd = lmpDate;
  } else if (!this.edd && this.lmp) { // If EDD isn't set but LMP is, calculate it
    const lmpDate = new Date(this.lmp);
    lmpDate.setDate(lmpDate.getDate() + 7);
    lmpDate.setMonth(lmpDate.getMonth() - 3);
    lmpDate.setFullYear(lmpDate.getFullYear() + 1);
    this.edd = lmpDate;
  }

  // 3. Auto-calculate BMI if weight and height are available in latestVitals
  if (this.latestVitals && this.latestVitals.weight && this.latestVitals.height) {
    const weightKg = this.latestVitals.weight;
    const heightMeters = this.latestVitals.height / 100; // Convert cm to meters
    if (heightMeters > 0) {
      this.latestVitals.bmi = parseFloat((weightKg / (heightMeters * heightMeters)).toFixed(2)); // Store as a number, rounded to 2 decimal places
    } else {
      this.latestVitals.bmi = null; // Or handle as an error/default
    }
  }

  next(); // Proceed with the save operation
});

// --- Export the Mongoose Model ---
module.exports = mongoose.model('Patient', PatientSchema);