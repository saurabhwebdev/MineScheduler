const mongoose = require('mongoose');

const SiteSchema = new mongoose.Schema({
  siteId: {
    type: String,
    required: [true, 'Please add a site ID'],
    unique: true,
    trim: true,
    uppercase: true
  },
  siteName: {
    type: String,
    required: [true, 'Please add a site name'],
    trim: true
  },
  priority: {
    type: Number,
    required: [true, 'Please add a priority'],
    min: [1, 'Priority must be at least 1'],
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  location: {
    type: String,
    trim: true,
    default: ''
  },
  siteType: {
    type: String,
    enum: ['mining', 'backfill', 'development', 'exploration', 'other'],
    default: 'mining'
  },
  // Planning data for scheduling algorithm
  totalBackfillTonnes: {
    type: Number,
    min: 0,
    default: 0
  },
  totalPlanMeters: {
    type: Number,
    min: 0,
    default: 0
  },
  remoteTonnes: {
    type: Number,
    min: 0,
    default: 0
  },
  currentTask: {
    type: String,
    trim: true,
    default: ''
  },
  timeToComplete: {
    type: Number,
    min: 0,
    default: 0,
    // Time in hours
  },
  firings: {
    type: Number,
    min: 0,
    default: 0,
    // Number of blast cycles
  },
  width: {
    type: Number,
    min: 0,
    default: 0,
    // Width in meters
  },
  height: {
    type: Number,
    min: 0,
    default: 0,
    // Height in meters
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt on save
SiteSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for calculated volume (if width and height are provided)
SiteSchema.virtual('calculatedVolume').get(function() {
  if (this.totalPlanMeters && this.width && this.height) {
    return (this.totalPlanMeters * this.width * this.height).toFixed(2);
  }
  return 0;
});

// Ensure virtuals are included when converting to JSON
SiteSchema.set('toJSON', { virtuals: true });
SiteSchema.set('toObject', { virtuals: true });

// Index for faster queries
SiteSchema.index({ priority: 1, isActive: -1 });
SiteSchema.index({ siteName: 'text' });
// Note: siteId index already created by unique: true

module.exports = mongoose.model('Site', SiteSchema);
