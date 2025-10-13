const mongoose = require('mongoose');

const EquipmentSchema = new mongoose.Schema({
  equipmentId: {
    type: String,
    required: [true, 'Please add an equipment ID'],
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Please add equipment name'],
    trim: true
  },
  type: {
    type: String,
    enum: ['Excavator', 'Haul Truck', 'Drill', 'Loader', 'Grader', 'Dozer', 'Bogger', 'Other'],
    required: [true, 'Please specify equipment type']
  },
  status: {
    type: String,
    enum: ['operational', 'maintenance', 'out-of-service'],
    default: 'operational'
  },
  location: {
    type: String,
    trim: true,
    default: ''
  },
  // Specifications
  manufacturer: {
    type: String,
    trim: true,
    default: ''
  },
  model: {
    type: String,
    trim: true,
    default: ''
  },
  year: {
    type: Number,
    min: 1900,
    max: 2100
  },
  capacity: {
    type: String,
    trim: true,
    default: ''
  },
  serialNumber: {
    type: String,
    trim: true,
    default: ''
  },
  // Maintenance tracking
  lastMaintenance: {
    type: Date,
    default: null
  },
  nextMaintenance: {
    type: Date,
    default: null
  },
  maintenanceInterval: {
    type: Number,
    default: 500,
    min: 0,
    // Interval in operating hours
  },
  operatingHours: {
    type: Number,
    default: 0,
    min: 0
  },
  // Task assignments
  assignedTasks: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
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
EquipmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for maintenance status
EquipmentSchema.virtual('maintenanceStatus').get(function() {
  if (!this.nextMaintenance) return 'unknown';
  const now = new Date();
  const daysUntilMaintenance = Math.ceil((this.nextMaintenance - now) / (1000 * 60 * 60 * 24));
  
  if (daysUntilMaintenance < 0) return 'overdue';
  if (daysUntilMaintenance <= 7) return 'due-soon';
  return 'good';
});

// Virtual for hours until maintenance
EquipmentSchema.virtual('hoursUntilMaintenance').get(function() {
  if (!this.lastMaintenance || !this.maintenanceInterval) return null;
  const hoursSinceLastMaintenance = this.operatingHours;
  return Math.max(0, this.maintenanceInterval - hoursSinceLastMaintenance);
});

// Ensure virtuals are included when converting to JSON
EquipmentSchema.set('toJSON', { virtuals: true });
EquipmentSchema.set('toObject', { virtuals: true });

// Index for faster queries
EquipmentSchema.index({ equipmentId: 1 });
EquipmentSchema.index({ type: 1, status: 1 });
EquipmentSchema.index({ location: 1 });

module.exports = mongoose.model('Equipment', EquipmentSchema);
