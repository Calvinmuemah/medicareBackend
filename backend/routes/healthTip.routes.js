// --- Health Tip Management Routes ---
const express = require('express');
const {
  createHealthTip,
  getHealthTips,
  getHealthTip,
  updateHealthTip,
  deleteHealthTip,
} = require('../controllers/healthTip.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { USER_ROLES } = require('../utils/constants');

const router = express.Router();

// Create and view health tips
router.route('/')
  .post(protect, authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.HOSPITAL_ADMIN, USER_ROLES.STAFF), createHealthTip)
  .get(protect, getHealthTips);

// View/update/delete specific tip
router.route('/:id')
  .get(protect, getHealthTip)
  .put(protect, authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.HOSPITAL_ADMIN, USER_ROLES.STAFF), updateHealthTip)
  .delete(protect, authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.HOSPITAL_ADMIN, USER_ROLES.STAFF), deleteHealthTip);

module.exports = router;
