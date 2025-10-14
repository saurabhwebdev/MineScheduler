const express = require('express');
const router = express.Router();
const Snapshot = require('../models/Snapshot');
const { protect } = require('../middleware/auth');
const { logAudit, getClientIp, getUserAgent } = require('../utils/auditLogger');

// @route   POST /api/snapshots
// @desc    Create a new snapshot
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const {
      name,
      description,
      gridData,
      gridHours,
      delayedSlots,
      sitePriority,
      siteActive,
      taskColors,
      taskLimits
    } = req.body;

    // Calculate statistics
    const totalSites = Object.keys(gridData || {}).length;
    const activeSites = Object.values(siteActive || {}).filter(Boolean).length;
    
    // Count total allocated tasks
    let totalTasks = 0;
    Object.values(gridData || {}).forEach(row => {
      totalTasks += row.filter(cell => cell !== '').length;
    });

    const snapshot = await Snapshot.create({
      name,
      description: description || '',
      gridData,
      gridHours,
      delayedSlots: delayedSlots || [],
      sitePriority: sitePriority || {},
      siteActive: siteActive || {},
      taskColors: taskColors || {},
      taskLimits: taskLimits || {},
      totalSites,
      activeSites,
      totalTasks,
      totalDelays: (delayedSlots || []).length,
      createdBy: req.user.id
    });

    // Log audit
    await logAudit({
      user: req.user,
      action: 'CREATE',
      module: 'SNAPSHOT',
      resourceType: 'Snapshot',
      resourceId: snapshot._id,
      resourceName: snapshot.name,
      newValues: {
        name: snapshot.name,
        gridHours: snapshot.gridHours,
        totalSites: snapshot.totalSites,
        activeSites: snapshot.activeSites,
        totalTasks: snapshot.totalTasks,
        totalDelays: snapshot.totalDelays
      },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });

    res.status(201).json({
      status: 'success',
      data: {
        snapshot
      }
    });
  } catch (error) {
    console.error('Create snapshot error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to create snapshot'
    });
  }
});

// @route   GET /api/snapshots
// @desc    Get all snapshots for current user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const snapshots = await Snapshot.find({ createdBy: req.user.id })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email')
      .select('-gridData'); // Exclude large gridData from list view

    res.json({
      status: 'success',
      count: snapshots.length,
      data: {
        snapshots
      }
    });
  } catch (error) {
    console.error('Get snapshots error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch snapshots'
    });
  }
});

// @route   GET /api/snapshots/:id
// @desc    Get single snapshot by ID (includes full grid data)
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const snapshot = await Snapshot.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!snapshot) {
      return res.status(404).json({
        status: 'error',
        message: 'Snapshot not found'
      });
    }

    // Check ownership
    if (snapshot.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to access this snapshot'
      });
    }

    res.json({
      status: 'success',
      data: {
        snapshot
      }
    });
  } catch (error) {
    console.error('Get snapshot error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch snapshot'
    });
  }
});

// @route   DELETE /api/snapshots/:id
// @desc    Delete a snapshot
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const snapshot = await Snapshot.findById(req.params.id);

    if (!snapshot) {
      return res.status(404).json({
        status: 'error',
        message: 'Snapshot not found'
      });
    }

    // Check ownership
    if (snapshot.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this snapshot'
      });
    }

    const snapshotName = snapshot.name;
    await snapshot.deleteOne();

    // Log audit
    await logAudit({
      user: req.user,
      action: 'DELETE',
      module: 'SNAPSHOT',
      resourceType: 'Snapshot',
      resourceId: req.params.id,
      resourceName: snapshotName,
      oldValues: {
        name: snapshotName,
        gridHours: snapshot.gridHours,
        totalSites: snapshot.totalSites
      },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });

    res.json({
      status: 'success',
      message: 'Snapshot deleted successfully'
    });
  } catch (error) {
    console.error('Delete snapshot error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete snapshot'
    });
  }
});

module.exports = router;
