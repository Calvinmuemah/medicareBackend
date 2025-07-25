const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { USER_ROLES } = require('../utils/constants');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: Object.values(USER_ROLES),
    default: USER_ROLES.PATIENT,
  },
  hospital: {
    type: mongoose.Schema.ObjectId,
    ref: 'Hospital',
    required: function () {
      return [USER_ROLES.HOSPITAL_ADMIN, USER_ROLES.STAFF, USER_ROLES.PATIENT].includes(this.role);
    },
  },
  specialty: {
    type: String,
    enum: ['General Practitioner', 'Obstetrician', 'Nurse', 'Midwife', 'Other'],
    required: function () {
      return this.role === USER_ROLES.STAFF;
    },
    default: 'Other',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
