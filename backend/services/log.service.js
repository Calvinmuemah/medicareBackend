const Log = require('../models/Log');

exports.logActivity = async (userId, userRole, action, resource, resourceId = null) => {
  try {
    await Log.create({
      user: userId,
      role: userRole,
      action,
      resource,
      resourceId,
    });
  } catch (error) {
    console.error(`[Log Service] Error for user ${userId}: ${error.message}`);
  }
};
