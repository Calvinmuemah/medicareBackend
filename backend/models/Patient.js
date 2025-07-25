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
  dateOfBirth: {
    type: Date,
    required: [true, 'Please add patient date of birth'],
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  },
  edd: {
    type: Date,
    required: [true, 'Please add estimated due date'],
  },
  emergencyContactName: {
    type: String,
    required: [true, 'Please add emergency contact name'],
  },
  emergencyContactPhone: {
    type: String,
    required: [true, 'Please add emergency contact phone'],
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
});

PatientSchema.pre('save', async function (next) {
  const user = await mongoose.model('User').findById(this.user);
  if (!user || user.role !== 'patient') {
    return next(new Error('Associated user must have a "patient" role.'));
  }
  next();
});

module.exports = mongoose.model('Patient', PatientSchema);
