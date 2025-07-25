// --- Visit Management Routes ---
const express = require('express');
const {
  createVisit,
  getPatientVisits,
  getVisit,
  updateVisit,
  deleteVisit,
} = require('../controllers/visit.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { USER_ROLES } = require('../utils/constants');

const router = express.Router();

// Visit creation and retrieval for a patient
router.route('/patients/:patientId/visits')
  .post(protect, authorize(USER_ROLES.STAFF), createVisit)
  .get(protect, authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.HOSPITAL_ADMIN, USER_ROLES.STAFF, USER_ROLES.PATIENT), getPatientVisits);

// Specific visit management
router.route('/:id')
  .get(protect, authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.HOSPITAL_ADMIN, USER_ROLES.STAFF, USER_ROLES.PATIENT), getVisit)
  .put(protect, authorize(USER_ROLES.HOSPITAL_ADMIN, USER_ROLES.STAFF), updateVisit)
  .delete(protect, authorize(USER_ROLES.HOSPITAL_ADMIN, USER_ROLES.STAFF), deleteVisit);

module.exports = router;
