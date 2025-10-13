const mongoose = require('mongoose');

const DelaySchema = new mongoose.Schema({
  delayCategory: {
    type: String,
    required: [true, 'Please add a delay category'],
    trim: true
  },
  delayCode: {
    type: String,
    required: [true, 'Please add a delay code'],
    unique: true,
    trim: true
  },
  delayType: {
    type: String,
    enum: ['standard', 'custom'],
    required: [true, 'Please specify delay type'],
    default: 'custom'
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    trim: true
  },
  delayDuration: {
    type: Number,
    min: 0,
    default: null,
    // Duration is optional but recommended for standard delays
    required: function() {
      return this.delayType === 'standard';
    }
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
DelaySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Delay', DelaySchema);
