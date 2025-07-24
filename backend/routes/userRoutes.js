const express = require('express');
const {
  registerUser,
  loginUser,
  getUser,
  updateProfile,
  resetPassword,
} = require('../Controllers/UserControllers');
const { authMiddleware, isAdmin, isDoctor } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/user/:id', authMiddleware, getUser);
router.put('/profile', authMiddleware, updateProfile);
router.put('/password', authMiddleware, resetPassword);
// Admin & Doctor example
router.get('/admin/data', authMiddleware, isAdmin, (req, res) => res.send("Hello Admin"));
router.get('/doctor/data', authMiddleware, isDoctor, (req, res) => res.send("Hello Doctor"));
module.exports = router;
