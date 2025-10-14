const mongoose = require('mongoose');

const equipmentTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Equipment type name is required'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: 'ToolOutlined'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
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

// Update the updatedAt timestamp before saving
equipmentTypeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster queries
equipmentTypeSchema.index({ name: 1 });
equipmentTypeSchema.index({ isActive: 1 });

module.exports = mongoose.model('EquipmentType', equipmentTypeSchema);
