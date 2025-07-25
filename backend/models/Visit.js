const mongoose = require('mongoose');

const VisitSchema = new mongoose.Schema({
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
  visitDate: {
    type: Date,
    required: [true, 'Please add visit date and time'],
  },
  visitType: {
    type: String,
    enum: ['Antenatal', 'Postnatal', 'Delivery', 'Emergency', 'Other'],
    default: 'Antenatal',
  },
  notes: {
    type: String,
    required: [true, 'Please add visit notes'],
  },
  weight: Number,
  bloodPressure: String,
  fetalHeartRate: Number,
  fundalHeight: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Visit', VisitSchema);
