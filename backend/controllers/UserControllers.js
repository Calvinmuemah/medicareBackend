const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../Models/UserModels');

// Predefined role emails (can be moved to constants.js)
const ADMIN_EMAILS = ['kasera@gmail.com'];
const DOCTOR_EMAILS = ['juma@gmail.com'];

// Generate JWT Token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register User
const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, password2 } = req.body;

    if (!name || !email || !password || !password2) {
      return res.status(422).json({ message: 'Please fill in all required fields' });
    }

    const newEmail = email.toLowerCase();

    if (await User.findOne({ email: newEmail })) {
      return res.status(422).json({ message: 'Email already exists' });
    }

    if (phone) {
      if (!/^\d{10}$/.test(phone)) {
        return res.status(422).json({ message: 'Phone must be 10 digits' });
      }
      if (await User.findOne({ phone })) {
        return res.status(422).json({ message: 'Phone already in use' });
      }
    }

    if (password.length < 6) {
      return res.status(422).json({ message: 'Password must be at least 6 characters' });
    }

    if (password !== password2) {
      return res.status(422).json({ message: 'Passwords do not match' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const isAdmin = ADMIN_EMAILS.includes(newEmail);
    const isDoctor = DOCTOR_EMAILS.includes(newEmail);

    const newUser = await User.create({
      name,
      email: newEmail,
      phone: phone || null,
      password: hashedPassword,
      isAdmin,
      isDoctor,
    });

    res.status(201).json({ message: `User ${newUser.name} registered successfully.` });

  } catch (err) {
    console.error('Register Error:', err.message);
    res.status(500).json({ message: 'Registration failed' });
  }
};

// Login User & Set Cookie
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(422).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(422).json({ message: 'Invalid credentials' });

    const token = generateToken({
      id: user._id,
      isAdmin: user.isAdmin,
      isDoctor: user.isDoctor,
    });

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
        isDoctor: user.isDoctor,
      },
    });

  } catch (err) {
    console.error('Login Error:', err.message);
    res.status(500).json({ message: 'Login failed' });
  }
};

// Get User by ID
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Get User Error:', err.message);
    res.status(500).json({ message: 'Could not fetch user' });
  }
};

// Update Profile (Name, Phone)
const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user.id);

    if (name) user.name = name;
    if (phone) {
      if (!/^\d{10}$/.test(phone)) {
        return res.status(422).json({ message: 'Phone must be 10 digits' });
      }
      user.phone = phone;
    }

    await user.save();
    res.json({ message: "Profile updated", user });
  } catch (err) {
    console.error('Update Error:', err.message);
    res.status(500).json({ message: 'Could not update profile' });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) {
      return res.status(422).json({ message: 'Old password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Reset Password Error:', err.message);
    res.status(500).json({ message: 'Password update failed' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUser,
  updateProfile,
  resetPassword,
};
