const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  hospital: {
    type: mongoose.Schema.ObjectId,
    ref: 'Hospital',
    required: true,
  },
  registeredBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
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
    trim: true,
  },
  phoneNumber: {
    type: String,
    required: [true, 'Please add the patient\'s phone number for SMS reminders'],
  },
  nationalIdClinicId: {
    type: String,
    trim: true,
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Please add patient date of birth'],
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  },
  maritalStatus: {
    type: String,
    enum: ['Single', 'Married', 'Other'],
    required: [true, 'Please select marital status'],
  },
  emergencyContactName: {
    type: String,
    required: [true, 'Please add emergency contact name'],
    trim: true,
  },
  emergencyContactPhone: {
    type: String,
    required: [true, 'Please add emergency contact phone'],
  },
  nextOfKinName: {
    type: String,
    trim: true,
  },
  nextOfKinContact: {
    type: String,
  },
  locationVillage: {
    type: String,
    required: [true, 'Please add the patient\'s location or village'],
    trim: true,
  },
  languagePreference: {
    type: String,
    enum: ['English', 'Kiswahili', 'Other'],
    default: 'English',
  },
  dateOfFirstVisit: {
    type: Date,
    default: Date.now,
  },
  pregnancyStatus: {
    type: String,
    enum: ['First pregnancy', 'Subsequent pregnancy'],
    required: [true, 'Please specify pregnancy status'],
  },

  // --- Step 2: Health Information ---
  lmp: {
    type: Date,
    required: [true, 'Please add the Last Menstrual Period (LMP) for EDD calculation'],
  },
  edd: { // Estimated Due Date - This is the field causing the error
    type: Date,
    // required: [fasle, 'Please add estimated due date'],
  },
  gravida: {
    type: Number,
    min: 0,
    default: 0,
  },
  parity: {
    type: Number,
    min: 0,
    default: 0,
  },
  knownConditions: {
    type: [String],
  },
  allergies: {
    type: String,
  },

  // --- Vital Signs & Measurements ---
  latestVitals: {
    bloodPressure: {
      systolic: Number,
      diastolic: Number,
      recordedAt: Date,
    },
    fetalHeartRate: {
      type: Number,
      recordedAt: Date,
    },
    weight: {
      type: Number,
      recordedAt: Date,
    },
    height: {
      type: Number,
      recordedAt: Date,
    },
    bmi: {
      type: Number,
      recordedAt: Date,
    },
    temperature: {
      type: Number,
      recordedAt: Date,
    },
    muac: {
      type: Number,
      recordedAt: Date,
    },
  },
});

// --- Mongoose Middleware (Pre-save Hooks) ---
PatientSchema.pre('save', async function (next) {
  // 1. Validate User Role
  const user = await mongoose.model('User').findById(this.user);
  if (!user || user.role !== 'patient') {
    return next(new Error('Associated user must have a "patient" role.'));
  }

  // --- DEBUGGING LOGS FOR EDD ---
  console.log('--- PatientSchema Pre-Save Hook ---');
  console.log('Current LMP (this.lmp):', this.lmp);
  console.log('Type of this.lmp:', typeof this.lmp);
  console.log('Is LMP modified?', this.isModified('lmp'));
  console.log('Current EDD (before calc):', this.edd);
  // --- END DEBUGGING LOGS ---


  // 2. Auto-calculate EDD (Estimated Due Date) if LMP is provided or modified
  if (this.isModified('lmp') && this.lmp) {
    const lmpDate = new Date(this.lmp);
    // Ensure lmpDate is valid before proceeding with calculations
    if (isNaN(lmpDate.getTime())) {
        console.error('Invalid LMP date detected in pre-save hook:', this.lmp);
        return next(new Error('Invalid Last Menstrual Period (LMP) date provided.'));
    }

    // Naegele's Rule: Add 7 days to LMP, subtract 3 months, add 1 year
    lmpDate.setDate(lmpDate.getDate() + 7);
    lmpDate.setMonth(lmpDate.getMonth() - 3);
    lmpDate.setFullYear(lmpDate.getFullYear() + 1);
    this.edd = lmpDate;

    console.log('EDD calculated:', this.edd); // Log the calculated EDD
  } else if (!this.edd && this.lmp) { // Fallback if EDD isn't set but LMP is
    const lmpDate = new Date(this.lmp);
    if (isNaN(lmpDate.getTime())) {
        console.error('Invalid LMP date detected in pre-save hook (fallback):', this.lmp);
        return next(new Error('Invalid Last Menstrual Period (LMP) date provided.'));
    }
    lmpDate.setDate(lmpDate.getDate() + 7);
    lmpDate.setMonth(lmpDate.getMonth() - 3);
    lmpDate.setFullYear(lmpDate.getFullYear() + 1);
    this.edd = lmpDate;
    console.log('EDD calculated (fallback):', this.edd); // Log the calculated EDD
  } else {
      console.log('LMP not modified or not present, EDD not calculated in hook.');
  }

  // 3. Auto-calculate BMI (retained)
  if (this.latestVitals && this.latestVitals.weight && this.latestVitals.height) {
    const weightKg = this.latestVitals.weight;
    const heightMeters = this.latestVitals.height / 100;
    if (heightMeters > 0) {
      this.latestVitals.bmi = parseFloat((weightKg / (heightMeters * heightMeters)).toFixed(2));
    } else {
      this.latestVitals.bmi = null;
    }
  }

  console.log('Final EDD before saving:', this.edd); // Crucial check before next()
  console.log('--- End Pre-Save Hook ---');

  next();
});

// --- Export the Mongoose Model ---
module.exports = mongoose.model('Patient', PatientSchema);