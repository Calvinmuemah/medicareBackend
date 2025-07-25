// --- Reminder Management Routes ---
const express = require('express');
const {
  createReminder,
  getReminders,
  getReminder,
  updateReminder,
  deleteReminder,
} = require('../controllers/reminder.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { USER_ROLES } = require('../utils/constants');

const router = express.Router();

router.route('/')
  .post(protect, authorize(USER_ROLES.STAFF), createReminder)
  .get(protect, authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.HOSPITAL_ADMIN, USER_ROLES.STAFF, USER_ROLES.PATIENT), getReminders);

router.route('/:id')
  .get(protect, authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.HOSPITAL_ADMIN, USER_ROLES.STAFF, USER_ROLES.PATIENT), getReminder)
  .put(protect, authorize(USER_ROLES.HOSPITAL_ADMIN, USER_ROLES.STAFF), updateReminder)
  .delete(protect, authorize(USER_ROLES.HOSPITAL_ADMIN, USER_ROLES.STAFF), deleteReminder);

module.exports = router;
