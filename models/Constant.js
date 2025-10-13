const mongoose = require('mongoose');

const ConstantSchema = new mongoose.Schema({
  keyword: {
    type: String,
    required: [true, 'Keyword is required'],
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z_]+$/, 'Keyword must contain only uppercase letters and underscores']
  },
  value: {
    type: Number,
    required: [true, 'Value is required'],
    min: [0, 'Value must be positive']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['Mining', 'Calculation', 'System', 'Other'],
    default: 'Mining'
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
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for faster queries
ConstantSchema.index({ category: 1 });
ConstantSchema.index({ isActive: 1 });
// Note: keyword index already created by unique: true

// Static method to get constant value by keyword
ConstantSchema.statics.getValue = async function(keyword) {
  const constant = await this.findOne({ keyword: keyword.toUpperCase(), isActive: true });
  return constant ? constant.value : null;
};

// Static method to get all active constants as a key-value map
ConstantSchema.statics.getActiveConstants = async function() {
  const constants = await this.find({ isActive: true });
  const map = {};
  constants.forEach(c => {
    map[c.keyword] = c.value;
  });
  return map;
};

module.exports = mongoose.model('Constant', ConstantSchema);
