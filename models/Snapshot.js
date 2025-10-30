const mongoose = require('mongoose');

const SnapshotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a snapshot name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters'],
    default: ''
  },
  snapshotDate: {
    type: Date,
    required: [true, 'Please add a snapshot date'],
    default: Date.now
  },
  // Schedule data
  gridData: {
    type: Object,
    required: true
    // Format: { 'siteId': ['DR', 'DR', 'CH', ...], ... }
  },
  gridHours: {
    type: Number,
    required: true,
    enum: [24, 48]
  },
  delayedSlots: {
    type: Array,
    default: []
    // Format: [{ row: 'siteId', hourIndex: 5, category: '...', code: '...', comments: '...', duration: 1 }]
  },
  // Metadata for display
  sitePriority: {
    type: Object,
    default: {}
  },
  siteActive: {
    type: Object,
    default: {}
  },
  taskColors: {
    type: Object,
    default: {}
  },
  taskLimits: {
    type: Object,
    default: {}
  },
  // Statistics
  totalSites: {
    type: Number,
    default: 0
  },
  activeSites: {
    type: Number,
    default: 0
  },
  totalTasks: {
    type: Number,
    default: 0
  },
  totalDelays: {
    type: Number,
    default: 0
  },
  // Audit fields
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
SnapshotSchema.index({ createdBy: 1, createdAt: -1 });
SnapshotSchema.index({ createdBy: 1, snapshotDate: -1 });
SnapshotSchema.index({ name: 'text', description: 'text' });

// Virtual for age (how old is this snapshot)
SnapshotSchema.virtual('age').get(function() {
  const now = new Date();
  const diffMs = now - this.createdAt;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Ensure virtuals are included when converting to JSON
SnapshotSchema.set('toJSON', { virtuals: true });
SnapshotSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Snapshot', SnapshotSchema);
