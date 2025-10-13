const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { logAudit, getClientIp, getUserAgent } = require('../utils/auditLogger');

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    
    res.json({
      status: 'success',
      count: users.length,
      data: {
        users
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      status: 'error',
      message: 'Server error' 
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        status: 'error',
        message: 'User not found' 
      });
    }

    res.json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      status: 'error',
      message: 'Server error' 
    });
  }
});

// @route   POST /api/users
// @desc    Create user (admin only)
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ 
        status: 'error',
        message: 'User already exists' 
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user'
    });

    // Log audit
    await logAudit({
      user: req.user,
      action: 'CREATE',
      module: 'USER',
      resourceType: 'User',
      resourceId: user._id,
      resourceName: user.name,
      newValues: { name: user.name, email: user.email, role: user.role },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      status: 'error',
      message: 'Server error' 
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    // Make sure user can only update their own profile (unless admin)
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        status: 'error',
        message: 'Not authorized to update this user' 
      });
    }

    // Get old values for audit
    const oldUser = await User.findById(req.params.id).select('-password');
    if (!oldUser) {
      return res.status(404).json({ 
        status: 'error',
        message: 'User not found' 
      });
    }

    const { name, email, phone, department, designation, employeeId, location, gender, bio } = req.body;
    const updateData = {};
    
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (department !== undefined) updateData.department = department;
    if (designation !== undefined) updateData.designation = designation;
    if (employeeId !== undefined) updateData.employeeId = employeeId;
    if (location !== undefined) updateData.location = location;
    if (gender !== undefined) updateData.gender = gender;
    if (bio !== undefined) updateData.bio = bio;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    // Log audit
    await logAudit({
      user: req.user,
      action: 'UPDATE',
      module: 'USER',
      resourceType: 'User',
      resourceId: user._id,
      resourceName: user.name,
      oldValues: { name: oldUser.name, email: oldUser.email, role: oldUser.role, department: oldUser.department },
      newValues: { name: user.name, email: user.email, role: user.role, department: user.department },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });

    res.json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      status: 'error',
      message: 'Server error' 
    });
  }
});

// @route   PUT /api/users/:id/role
// @desc    Update user role (admin only)
// @access  Private/Admin
router.put('/:id/role', protect, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Invalid role. Must be user or admin' 
      });
    }

    // Get old values for audit
    const oldUser = await User.findById(req.params.id).select('-password');
    if (!oldUser) {
      return res.status(404).json({ 
        status: 'error',
        message: 'User not found' 
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    // Log audit for role change
    await logAudit({
      user: req.user,
      action: 'UPDATE',
      module: 'USER',
      resourceType: 'User Role',
      resourceId: user._id,
      resourceName: user.name,
      oldValues: { role: oldUser.role },
      newValues: { role: user.role },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });

    res.json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      status: 'error',
      message: 'Server error' 
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ 
        status: 'error',
        message: 'User not found' 
      });
    }

    // Log audit
    await logAudit({
      user: req.user,
      action: 'DELETE',
      module: 'USER',
      resourceType: 'User',
      resourceId: user._id,
      resourceName: user.name,
      oldValues: { name: user.name, email: user.email, role: user.role },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });

    res.json({
      status: 'success',
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      status: 'error',
      message: 'Server error' 
    });
  }
});

module.exports = router;
