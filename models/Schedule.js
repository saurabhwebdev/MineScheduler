const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
  // Schedule metadata
  generatedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  gridHours: {
    type: Number,
    required: true,
    default: 24
  },
  // Schedule data
  grid: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  hourlyAllocation: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  taskDurations: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  sitePriority: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  siteActive: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  taskColors: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  taskLimits: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Delays applied
  delayedSlots: {
    type: Array,
    default: []
  },
  allDelays: {
    type: Array,
    default: []
  },
  shiftChangeoverDelays: {
    type: Array,
    default: []
  },
  // Shifts data
  shifts: {
    type: Array,
    default: []
  },
  // User who generated
  generatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  // Notes or description (optional)
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  // Status
  isActive: {
    type: Boolean,
    default: true
  }
});

// Index for faster queries
ScheduleSchema.index({ generatedAt: -1 });
ScheduleSchema.index({ generatedBy: 1, generatedAt: -1 });

// Virtual for formatted date
ScheduleSchema.virtual('formattedDate').get(function() {
  return this.generatedAt.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
});

// Ensure virtuals are included when converting to JSON
ScheduleSchema.set('toJSON', { virtuals: true });
ScheduleSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Schedule', ScheduleSchema);
