const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../Models/UserModels');

// Predefined role emails
const ADMIN_EMAILS = ['kasera@gmail.com'];
const DOCTOR_EMAILS = ['juma@gmail.com'];

//  Generate JWT Token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
};

//  Register New User
// POST /api/users/register
const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, password2 } = req.body;

    if (!name || !email || !password || !password2) {
      return res.status(422).json({ message: 'Please fill in all required fields' });
    }

    const newEmail = email.toLowerCase();

    // Check if email already exists
    const emailExists = await User.findOne({ email: newEmail });
    if (emailExists) {
      return res.status(422).json({ message: 'Email already exists' });
    }

    // Check if phone exists if provided
    if (phone) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
        return res.status(422).json({ message: 'Phone number already in use' });
      }
      if (!/^\d{10}$/.test(phone)) {
        return res.status(422).json({ message: 'Phone number must be exactly 10 digits' });
      }
    }

    // Validate password
    if (password.length < 6) {
      return res.status(422).json({ message: 'Password must be at least 6 characters' });
    }

    if (password !== password2) {
      return res.status(422).json({ message: 'Passwords do not match' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Determine roles
    const isAdmin = ADMIN_EMAILS.includes(newEmail);
    const isDoctor = DOCTOR_EMAILS.includes(newEmail);

    // Create user
    await User.create({
      name,
      email: newEmail,
      phone: phone || null,
      password: hashedPassword,
      isAdmin,
      isDoctor,
    });

    res.status(201).json({ message: `User ${name} registered successfully.` });

  } catch (error) {
    console.error('Register Error:', error.message);
    res.status(500).json({ message: 'User registration failed. Please try again.' });
  }
};

// 🔓 Login User
// POST /api/users/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(422).json({ message: 'Please fill in all fields' });
    }

    const newEmail = email.toLowerCase();
    const user = await User.findOne({ email: newEmail });

    if (!user) {
      return res.status(422).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(422).json({ message: 'Invalid credentials' });
    }

    const token = generateToken({
      id: user._id,
      isAdmin: user.isAdmin,
      isDoctor: user.isDoctor,
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
        isDoctor: user.isDoctor,
      },
    });

  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ message: 'Login failed. Please try again later.' });
  }
};

// 👤 Get Single User by ID for Admin to get ALl  the single user 
// GET /api/users/:id
const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get User Error:', error.message);
    res.status(500).json({ message: 'Failed to get user' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUser,
};
