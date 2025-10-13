const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/audit
// @desc    Get all audit logs (admin only)
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      module, 
      action, 
      user, 
      startDate, 
      endDate,
      search 
    } = req.query;

    // Build query
    const query = {};
    
    if (module) query.module = module;
    if (action) query.action = action;
    if (user) query.user = user;
    
    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Search filter (search in resourceName, userName, userEmail)
    if (search) {
      query.$or = [
        { resourceName: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get total count for pagination
    const total = await AuditLog.countDocuments(query);

    // Fetch audit logs
    const auditLogs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name email role');

    res.json({
      status: 'success',
      count: auditLogs.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: {
        auditLogs
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

// @route   GET /api/audit/stats
// @desc    Get audit statistics (admin only)
// @access  Private/Admin
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = {};
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Get statistics
    const totalLogs = await AuditLog.countDocuments(query);
    
    const actionStats = await AuditLog.aggregate([
      { $match: query },
      { $group: { _id: '$action', count: { $sum: 1 } } }
    ]);

    const moduleStats = await AuditLog.aggregate([
      { $match: query },
      { $group: { _id: '$module', count: { $sum: 1 } } }
    ]);

    const userStats = await AuditLog.aggregate([
      { $match: query },
      { $group: { _id: '$user', count: { $sum: 1 }, userName: { $first: '$userName' } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      status: 'success',
      data: {
        total: totalLogs,
        byAction: actionStats,
        byModule: moduleStats,
        topUsers: userStats
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

// @route   GET /api/audit/:id
// @desc    Get single audit log by ID (admin only)
// @access  Private/Admin
router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const auditLog = await AuditLog.findById(req.params.id)
      .populate('user', 'name email role');
    
    if (!auditLog) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Audit log not found' 
      });
    }

    res.json({
      status: 'success',
      data: {
        auditLog
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

module.exports = router;
