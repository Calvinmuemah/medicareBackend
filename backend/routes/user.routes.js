// --- General User Routes ---
const express = require('express');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
} = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { USER_ROLES } = require('../utils/constants');

const router = express.Router();

/**
 * @route   GET /api/v1/users
 * @desc    Get all users
 * @access  Private (Super Admin)
 */
router.get('/', protect, authorize(USER_ROLES.SUPER_ADMIN), getUsers);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get a specific user
 * @access  Private (Super Admin, Hospital Admin, Staff, Patient)
 */
router.get('/:id', protect, authorize(
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.HOSPITAL_ADMIN,
  USER_ROLES.STAFF,
  USER_ROLES.PATIENT
), getUser);

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update a user
 * @access  Private (Super Admin, Hospital Admin, Staff)
 */
router.put('/:id', protect, authorize(
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.HOSPITAL_ADMIN,
  USER_ROLES.STAFF
), updateUser);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete a user
 * @access  Private (Super Admin, Hospital Admin)
 */
router.delete('/:id', protect, authorize(
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.HOSPITAL_ADMIN
), deleteUser);

module.exports = router;
