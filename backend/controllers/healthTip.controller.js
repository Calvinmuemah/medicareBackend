const HealthTip = require('../models/HealthTip');
const ErrorResponse = require('../utils/errorResponse');
const { USER_ROLES } = require('../utils/constants');
const logService = require('../services/log.service');

// Utility: check if user has required role
const hasRole = (user, roles) => roles.includes(user.role);

// Utility: check if user is creator or has override role
const isAuthorizedToModify = (user, resourceCreatorId, allowedRoles = []) => {
  return (
    String(resourceCreatorId) === String(user._id) ||
    allowedRoles.includes(user.role)
  );
};

// @desc    Create a new health tip
// @route   POST /api/v1/healthtips
// @access  Private (Super Admin, Hospital Admin, Staff)
exports.createHealthTip = async (req, res, next) => {
  try {
    if (!hasRole(req.user, [USER_ROLES.SUPER_ADMIN, USER_ROLES.HOSPITAL_ADMIN, USER_ROLES.STAFF])) {
      return next(new ErrorResponse('Not authorized to create health tips', 403));
    }

    const healthTip = await HealthTip.create({ ...req.body, createdBy: req.user._id });

    await logService.logActivity(req.user._id, req.user.role, `Created health tip: "${healthTip.title}"`, 'HealthTip', healthTip._id);

    res.status(201).json({ success: true, data: healthTip });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all health tips
// @route   GET /api/v1/healthtips
// @access  Private (All authenticated users)
exports.getHealthTips = async (_req, res, next) => {
  try {
    const tips = await HealthTip.find().populate('createdBy', 'name role');
    res.status(200).json({ success: true, count: tips.length, data: tips });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single health tip
// @route   GET /api/v1/healthtips/:id
// @access  Private (All authenticated users)
exports.getHealthTip = async (req, res, next) => {
  try {
    const tip = await HealthTip.findById(req.params.id).populate('createdBy', 'name role');

    if (!tip) return next(new ErrorResponse(`Health tip not found`, 404));

    res.status(200).json({ success: true, data: tip });
  } catch (error) {
    next(error);
  }
};

// @desc    Update health tip
// @route   PUT /api/v1/healthtips/:id
// @access  Private (Creator, Super Admin, Hospital Admin)
exports.updateHealthTip = async (req, res, next) => {
  try {
    let tip = await HealthTip.findById(req.params.id);
    if (!tip) return next(new ErrorResponse(`Health tip not found`, 404));

    if (!isAuthorizedToModify(req.user, tip.createdBy, [USER_ROLES.SUPER_ADMIN, USER_ROLES.HOSPITAL_ADMIN])) {
      return next(new ErrorResponse('Not authorized to update this tip', 403));
    }

    tip = await HealthTip.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    await logService.logActivity(req.user._id, req.user.role, `Updated health tip: "${tip.title}"`, 'HealthTip', tip._id);

    res.status(200).json({ success: true, data: tip });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete health tip
// @route   DELETE /api/v1/healthtips/:id
// @access  Private (Creator, Super Admin, Hospital Admin)
exports.deleteHealthTip = async (req, res, next) => {
  try {
    const tip = await HealthTip.findById(req.params.id);
    if (!tip) return next(new ErrorResponse(`Health tip not found`, 404));

    if (!isAuthorizedToModify(req.user, tip.createdBy, [USER_ROLES.SUPER_ADMIN, USER_ROLES.HOSPITAL_ADMIN])) {
      return next(new ErrorResponse('Not authorized to delete this tip', 403));
    }

    await tip.deleteOne();

    await logService.logActivity(req.user._id, req.user.role, `Deleted health tip: "${tip.title}"`, 'HealthTip', req.params.id);

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
