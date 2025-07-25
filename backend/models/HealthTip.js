const mongoose = require('mongoose');

const HealthTipSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: 100,
  },
  content: {
    type: String,
    required: [true, 'Please add content'],
    maxlength: 1000,
  },
  tags: [String],
  relevantWeek: {
    type: Number,
    min: 1,
    max: 42,
  },
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

module.exports = mongoose.model('HealthTip', HealthTipSchema);
