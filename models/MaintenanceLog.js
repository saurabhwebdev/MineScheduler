const mongoose = require('mongoose');

const MaintenanceLogSchema = new mongoose.Schema({
  equipment: {
    type: mongoose.Schema.ObjectId,
    ref: 'Equipment',
    required: [true, 'Please specify equipment']
  },
  maintenanceType: {
    type: String,
    enum: ['scheduled', 'unscheduled', 'emergency', 'inspection'],
    required: [true, 'Please specify maintenance type']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    trim: true
  },
  laborCost: {
    type: Number,
    min: 0,
    default: 0
  },
  partsCost: {
    type: Number,
    min: 0,
    default: 0
  },
  cost: {
    type: Number,
    min: 0,
    default: 0
  },
  duration: {
    type: Number,
    min: 0,
    default: 0,
    // Duration in hours
  },
  performedBy: {
    type: String,
    trim: true,
    default: ''
  },
  performedDate: {
    type: Date,
    required: [true, 'Please specify maintenance date'],
    default: Date.now
  },
  nextDue: {
    type: Date,
    default: null
  },
  partsReplaced: [{
    partName: String,
    partNumber: String,
    quantity: Number,
    cost: Number
  }],
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
  }
});

// Pre-save hook to calculate total cost
MaintenanceLogSchema.pre('save', function(next) {
  this.cost = (this.laborCost || 0) + (this.partsCost || 0);
  next();
});

// Index for faster queries
MaintenanceLogSchema.index({ equipment: 1, performedDate: -1 });
MaintenanceLogSchema.index({ maintenanceType: 1 });

module.exports = mongoose.model('MaintenanceLog', MaintenanceLogSchema);
