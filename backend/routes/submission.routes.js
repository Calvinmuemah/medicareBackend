// --- Patient Submission Routes ---
const express = require('express');
const {
  createSubmission,
  getMySubmissions,
  getHospitalSubmissions,
  getSubmission,
  updateSubmissionNotes,
  deleteSubmission,
} = require('../controllers/submission.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { USER_ROLES } = require('../utils/constants');

const router = express.Router();

// Patient submission routes
router.post('/me/submit', protect, authorize(USER_ROLES.PATIENT), createSubmission);
router.get('/me/submissions', protect, authorize(USER_ROLES.PATIENT), getMySubmissions);

// Hospital-level view
router.get('/hospitals/:hospitalId/submissions', protect, authorize(
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.HOSPITAL_ADMIN,
  USER_ROLES.STAFF
), getHospitalSubmissions);

// Specific submission management
router.route('/:id')
  .get(protect, authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.HOSPITAL_ADMIN, USER_ROLES.STAFF, USER_ROLES.PATIENT), getSubmission)
  .put(protect, authorize(USER_ROLES.HOSPITAL_ADMIN, USER_ROLES.STAFF), updateSubmissionNotes)
  .delete(protect, authorize(USER_ROLES.HOSPITAL_ADMIN, USER_ROLES.STAFF), deleteSubmission);

module.exports = router;
