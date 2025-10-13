const AuditLog = require('../models/AuditLog');

/**
 * Log an audit entry
 * @param {Object} params - Audit log parameters
 * @param {Object} params.user - User object (from req.user)
 * @param {String} params.action - Action type: CREATE, UPDATE, DELETE, VIEW
 * @param {String} params.module - Module name: UOM, TASK, USER, SETTINGS
 * @param {String} params.resourceType - Type of resource (e.g., 'UOM', 'Task', 'User')
 * @param {String} params.resourceId - ID of the resource
 * @param {String} params.resourceName - Name/identifier of the resource
 * @param {Object} params.oldValues - Old values (for UPDATE)
 * @param {Object} params.newValues - New values (for CREATE/UPDATE)
 * @param {String} params.ipAddress - Client IP address
 * @param {String} params.userAgent - Client user agent
 */
const logAudit = async ({
  user,
  action,
  module,
  resourceType,
  resourceId,
  resourceName,
  oldValues = {},
  newValues = {},
  ipAddress = null,
  userAgent = null
}) => {
  try {
    // Calculate changes for UPDATE actions
    const changes = {};
    if (action === 'UPDATE' && oldValues && newValues) {
      Object.keys(newValues).forEach(key => {
        if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
          changes[key] = {
            old: oldValues[key],
            new: newValues[key]
          };
        }
      });
    }

    const auditEntry = await AuditLog.create({
      user: user._id || user.id,
      userName: user.name,
      userEmail: user.email,
      action,
      module,
      resourceType,
      resourceId: resourceId.toString(),
      resourceName,
      changes,
      oldValues: action === 'UPDATE' ? oldValues : {},
      newValues: action === 'CREATE' || action === 'UPDATE' ? newValues : {},
      ipAddress,
      userAgent,
      timestamp: new Date()
    });

    console.log(`[AUDIT] ${action} ${module} - ${resourceName} by ${user.name}`);
    return auditEntry;
  } catch (error) {
    console.error('Error logging audit entry:', error);
    // Don't throw error to prevent disrupting main operations
    return null;
  }
};

/**
 * Get client IP address from request
 */
const getClientIp = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         req.ip ||
         'Unknown';
};

/**
 * Get user agent from request
 */
const getUserAgent = (req) => {
  return req.headers['user-agent'] || 'Unknown';
};

module.exports = {
  logAudit,
  getClientIp,
  getUserAgent
};
