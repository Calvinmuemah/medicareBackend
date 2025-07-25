const mongoose = require('mongoose');

const ReminderSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.ObjectId,
    ref: 'Patient',
    required: true,
  },
  hospital: {
    type: mongoose.Schema.ObjectId,
    ref: 'Hospital',
    required: true,
  },
  type: {
    type: String,
    enum: ['Appointment', 'Health Tip', 'Medication', 'Other'],
    required: true,
  },
  message: {
    type: String,
    required: [true, 'Please add reminder message'],
    maxlength: 300,
  },
  scheduledTime: {
    type: Date,
    required: [true, 'Please add scheduled time'],
  },
  sent: {
    type: Boolean,
    default: false,
  },
  sentAt: Date,
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Reminder', ReminderSchema);
