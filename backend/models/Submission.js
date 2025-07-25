const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
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
    enum: ['audio', 'text'],
    required: true,
  },
  content: {
    type: String,
    required: function () {
      return this.type === 'text';
    },
    maxlength: 1000,
  },
  fileUrl: {
    type: String,
    required: function () {
      return this.type === 'audio';
    },
  },
  notes: {
    type: String,
    maxlength: 500,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Submission', SubmissionSchema);
