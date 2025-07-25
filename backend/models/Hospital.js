const mongoose = require('mongoose');

const HospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a hospital name'],
    unique: true,
    trim: true,
    maxlength: 50,
  },
  address: {
    type: String,
    required: [true, 'Please add an address'],
  },
  phone: {
    type: String,
    maxlength: 20,
  },
  email: {
    type: String,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email'],
  },
  description: {
    type: String,
    maxlength: 500,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Hospital', HospitalSchema);
