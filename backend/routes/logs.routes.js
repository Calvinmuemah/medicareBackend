// --- Logs & Auditing Routes ---
const express = require('express');
const {
  getLogs,
  getUserLogs,
} = require('../controllers/logs.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { USER_ROLES } = require('../utils/constants');

const router = express.Router();

// Global logs
router.get('/', protect, authorize(USER_ROLES.SUPER_ADMIN), getLogs);

// Logs per user
router.get('/users/:userId', protect, authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.HOSPITAL_ADMIN), getUserLogs);

module.exports = router;
