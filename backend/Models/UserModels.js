// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  email: {
    type: String,
    unique: true,
    required: [true, "Email is required"],
    match: [/\S+@\S+\.\S+/, "Email is invalid"],
  },
  phone: {
    type: String,
    unique: true,
    sparse: true, 
    validate: {
      validator: function (v) {
        if (!v) return true; 
        return /^\d{10}$/.test(v); 
      },
      message: "Phone number must be exactly 10 digits",
    },
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  isDoctor: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
