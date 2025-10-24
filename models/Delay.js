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
    trim: true,
    uppercase: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    trim: true
  },
  color: {
    type: String,
    default: '#ff4d4f',
    trim: true,
    validate: {
      validator: function(v) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: props => `${props.value} is not a valid hex color code!`
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
