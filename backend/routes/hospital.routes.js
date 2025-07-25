// --- Hospital & Hospital Admin Routes ---

const express = require('express');
const router = express.Router();

const {
  onboardHospital,
  addHospitalAdmin,
  getHospitals,
  getHospital,
  updateHospital,
  deleteHospital,
} = require('../controllers/hospital.controller');

const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { USER_ROLES } = require('../utils/constants');

// Routes accessible only by Super Admin
router.post('/', protect, authorize(USER_ROLES.SUPER_ADMIN), onboardHospital);
router.post('/:hospitalId/admin', protect, authorize(USER_ROLES.SUPER_ADMIN), addHospitalAdmin);
router.delete('/:id', protect, authorize(USER_ROLES.SUPER_ADMIN), deleteHospital);

// Routes accessible by both Super Admin and Hospital Admin
router.get('/', protect, authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.HOSPITAL_ADMIN), getHospitals);
router.get('/:id', protect, authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.HOSPITAL_ADMIN), getHospital);
router.put('/:id', protect, authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.HOSPITAL_ADMIN), updateHospital);

module.exports = router;
