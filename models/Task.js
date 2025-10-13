const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  taskId: {
    type: String,
    required: [true, 'Please add a task ID'],
    unique: true,
    trim: true
  },
  taskName: {
    type: String,
    required: [true, 'Please add a task name'],
    trim: true
  },
  taskType: {
    type: String,
    enum: ['task', 'activity'],
    required: [true, 'Please specify task type'],
    default: 'task'
  },
  uom: {
    type: String,
    required: [true, 'Please add a UOM'],
    trim: true,
    default: 'NA'
  },
  rate: {
    type: Number,
    default: 0,
    min: 0,
    // Rate is required for activities but not for simple tasks
    required: function() {
      return this.taskType === 'activity';
    }
  },
  taskDuration: {
    type: Number,
    required: [true, 'Please add task duration in minutes'],
    min: 0
  },
  calculatedOutput: {
    type: Number,
    default: 0
  },
  formula: {
    type: String,
    trim: true,
    default: ''
  },
  limits: {
    type: Number,
    min: 1,
    max: 10,
    default: 1
  },
  order: {
    type: Number,
    default: 0
  },
  color: {
    type: String,
    default: '#3498db',
    trim: true
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

// Helper function to calculate output
function calculateOutput(taskType, rate, taskDuration) {
  if (taskType === 'activity' && rate && taskDuration) {
    const hours = taskDuration / 60;
    return hours * rate;
  }
  return 0;
}

// Helper function to extract UOM numerator (e.g., "meter/hour" -> "meter")
function getUomNumerator(uom) {
  if (!uom) return '';
  // If UOM contains '/', extract the part before it (numerator)
  if (uom.includes('/')) {
    return uom.split('/')[0].trim();
  }
  // Otherwise return the UOM as is
  return uom;
}

// Virtual field for UOM numerator (for display purposes)
TaskSchema.virtual('uomNumerator').get(function() {
  return getUomNumerator(this.uom);
});

// Ensure virtuals are included in JSON
TaskSchema.set('toJSON', { virtuals: true });
TaskSchema.set('toObject', { virtuals: true });

// Update updatedAt and calculate output on save
TaskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.calculatedOutput = calculateOutput(this.taskType, this.rate, this.taskDuration);
  next();
});

module.exports = mongoose.model('Task', TaskSchema);
