// --- Staff Management Routes ---
const express = require('express');
const {
  addStaff,
  getHospitalStaff,
  getStaff,
  updateStaff,
  deleteStaff,
} = require('../controllers/staff.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { USER_ROLES } = require('../utils/constants');

const router = express.Router();

/**
 * @route   POST /api/v1/hospitals/:hospitalId/staff
 * @desc    Add new staff to a hospital
 * @access  Private (Hospital Admin)
 */
router.post(
  '/hospitals/:hospitalId/staff',
  protect,
  authorize(USER_ROLES.HOSPITAL_ADMIN),
  addStaff
);

/**
 * @route   GET /api/v1/hospitals/:hospitalId/staff
 * @desc    Get all staff in a hospital
 * @access  Private (Super Admin, Hospital Admin, Staff)
 */
router.get(
  '/hospitals/:hospitalId/staff',
  protect,
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.HOSPITAL_ADMIN, USER_ROLES.STAFF),
  getHospitalStaff
);

/**
 * @route   GET /api/v1/staff/:id
 * @desc    Get specific staff details
 * @access  Private (Super Admin, Hospital Admin, Staff)
 */
router.get('/:id', protect, authorize(
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.HOSPITAL_ADMIN,
  USER_ROLES.STAFF
), getStaff);

/**
 * @route   PUT /api/v1/staff/:id
 * @desc    Update staff details
 * @access  Private (Hospital Admin, Staff)
 */
router.put('/:id', protect, authorize(
  USER_ROLES.HOSPITAL_ADMIN,
  USER_ROLES.STAFF
), updateStaff);

/**
 * @route   DELETE /api/v1/staff/:id
 * @desc    Delete a staff member
 * @access  Private (Hospital Admin)
 */
router.delete('/:id', protect, authorize(
  USER_ROLES.HOSPITAL_ADMIN
), deleteStaff);

module.exports = router;
