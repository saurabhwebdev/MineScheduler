const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  action: {
    type: String,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'VIEW'],
    required: true
  },
  module: {
    type: String,
    enum: ['UOM', 'TASK', 'USER', 'SETTINGS', 'SITE', 'EQUIPMENT', 'EQUIPMENT_TYPE', 'SHIFT', 'CONSTANT', 'DELAY'],
    required: true
  },
  resourceType: {
    type: String,
    required: true
  },
  resourceId: {
    type: String,
    required: true
  },
  resourceName: {
    type: String,
    required: true
  },
  changes: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  oldValues: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  newValues: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ user: 1 });
AuditLogSchema.index({ module: 1 });
AuditLogSchema.index({ action: 1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
