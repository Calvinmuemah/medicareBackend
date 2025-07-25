// --- Patient Management Routes ---
const express = require('express');
const {
  registerPatient,
  getHospitalPatients,
  getPatient,
  updatePatient,
  deletePatient,
} = require('../controllers/patient.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { USER_ROLES } = require('../utils/constants');

const router = express.Router();

// Register new patient
router.post('/', protect, authorize(USER_ROLES.STAFF), registerPatient);

// Get patients in a hospital
router.get('/hospitals/:hospitalId/patients', protect, authorize(
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.HOSPITAL_ADMIN,
  USER_ROLES.STAFF
), getHospitalPatients);

// Get, update, delete specific patient
router.route('/:id')
  .get(protect, authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.HOSPITAL_ADMIN, USER_ROLES.STAFF, USER_ROLES.PATIENT), getPatient)
  .put(protect, authorize(USER_ROLES.HOSPITAL_ADMIN, USER_ROLES.STAFF), updatePatient)
  .delete(protect, authorize(USER_ROLES.HOSPITAL_ADMIN), deletePatient);

module.exports = router;
