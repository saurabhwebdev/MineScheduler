const mongoose = require('mongoose');

const ShiftSchema = new mongoose.Schema({
  shiftName: {
    type: String,
    required: [true, 'Please add a shift name'],
    trim: true
  },
  shiftCode: {
    type: String,
    required: [true, 'Please add a shift code'],
    unique: true,
    trim: true,
    uppercase: true
  },
  startTime: {
    type: String,
    required: [true, 'Please add start time'],
    trim: true,
    // Format: "HH:MM" (24-hour format)
  },
  endTime: {
    type: String,
    required: [true, 'Please add end time'],
    trim: true,
    // Format: "HH:MM" (24-hour format)
  },
  shiftChangeDuration: {
    type: Number,
    required: [true, 'Please add shift change duration'],
    min: [0, 'Duration must be positive'],
    default: 30,
    // Duration in minutes for shift changeover
  },
  color: {
    type: String,
    default: '#1890ff',
    trim: true
  },
  description: {
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
ShiftSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual field for shift duration in hours
ShiftSchema.virtual('shiftDuration').get(function() {
  const start = this.startTime.split(':');
  const end = this.endTime.split(':');
  const startMinutes = parseInt(start[0]) * 60 + parseInt(start[1]);
  let endMinutes = parseInt(end[0]) * 60 + parseInt(end[1]);
  
  // Handle overnight shifts
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }
  
  return (endMinutes - startMinutes) / 60;
});

// Ensure virtuals are included when converting to JSON
ShiftSchema.set('toJSON', { virtuals: true });
ShiftSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Shift', ShiftSchema);
