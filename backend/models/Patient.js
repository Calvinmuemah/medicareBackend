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
    required: true,
    trim: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    trim: true,
  },
  nationalIdClinicId: {
    type: String,
    trim: true,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  maritalStatus: {
    type: String,
    enum: ['Single', 'Married', 'Other'],
    required: true,
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
    required: true,
    trim: true,
  },
  languagePreference: {
    type: String,
    enum: ['English', 'Kiswahili', 'Other'],
    default: 'English',
  },
  firstVisit: {
    type: String,
    trim: true,
  },
  pregnancyStatus: {
    type: String,
    enum: ['First pregnancy', 'Subsequent pregnancy'],
    required: true,
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  },
  emergencyContactName: {
    type: String,
    required: true,
    trim: true,
  },
  emergencyContactPhone: {
    type: String,
    required: true,
  },

  // --- Step 2: Health Information ---
  lmp: {
    type: Date,
    required: true,
  },
  edd: {
    type: Date,
  },
  gravida: {
    type: Number,
    default: 0,
  },
  parity: {
    type: Number,
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
  }
});

// --- Mongoose Middleware ---
PatientSchema.pre('save', async function (next) {
  const user = await mongoose.model('User').findById(this.user);
  if (!user || user.role !== 'patient') {
    return next(new Error('Associated user must have a "patient" role.'));
  }

  if (this.isModified('lmp') && this.lmp) {
    const lmpDate = new Date(this.lmp);
    if (isNaN(lmpDate.getTime())) {
      return next(new Error('Invalid Last Menstrual Period (LMP) date provided.'));
    }
    lmpDate.setDate(lmpDate.getDate() + 7);
    lmpDate.setMonth(lmpDate.getMonth() - 3);
    lmpDate.setFullYear(lmpDate.getFullYear() + 1);
    this.edd = lmpDate;
  }

  if (this.latestVitals && this.latestVitals.weight && this.latestVitals.height) {
    const weightKg = this.latestVitals.weight;
    const heightMeters = this.latestVitals.height / 100;
    this.latestVitals.bmi = heightMeters > 0 ? parseFloat((weightKg / (heightMeters * heightMeters)).toFixed(2)) : null;
  }

  next();
});

module.exports = mongoose.model('Patient', PatientSchema);
