// --- Appointment Management Routes ---
const express = require('express');
const {
  createAppointment,
  getAppointments,
  getAppointment,
  updateAppointment,
  deleteAppointment,
} = require('../controllers/appointment.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { USER_ROLES } = require('../utils/constants');

const router = express.Router();

router.route('/')
  .post(protect, authorize(USER_ROLES.STAFF), createAppointment)
  .get(protect, authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.HOSPITAL_ADMIN, USER_ROLES.STAFF, USER_ROLES.PATIENT), getAppointments);

router.route('/:id')
  .get(protect, authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.HOSPITAL_ADMIN, USER_ROLES.STAFF, USER_ROLES.PATIENT), getAppointment)
  .put(protect, authorize(USER_ROLES.HOSPITAL_ADMIN, USER_ROLES.STAFF), updateAppointment)
  .delete(protect, authorize(USER_ROLES.HOSPITAL_ADMIN, USER_ROLES.STAFF), deleteAppointment);

module.exports = router;
