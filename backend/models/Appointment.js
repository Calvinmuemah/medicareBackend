const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
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
  staff: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: [true, 'Please add appointment date and time'],
  },
  type: {
    type: String,
    enum: ['Antenatal Checkup', 'Postnatal Checkup', 'Vaccination', 'Consultation', 'Other'],
    default: 'Antenatal Checkup',
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'],
    default: 'Scheduled',
  },
  notes: {
    type: String,
    maxlength: 500,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Appointment', AppointmentSchema);
