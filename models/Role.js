const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a role name'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  permissions: {
    type: [String],
    default: [],
    validate: {
      validator: function(permissions) {
        const validRoutes = [
          '/dashboard',
          '/schedule',
          '/tasks',
          '/delays',
          '/sites',
          '/equipment',
          '/maintenance-logs',
          '/settings',
          '/help',
          '/users',
          '/audit'
        ];
        return permissions.every(p => validRoutes.includes(p));
      },
      message: 'Invalid route in permissions'
    }
  },
  isCustom: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Update updatedAt timestamp
RoleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Role', RoleSchema);
