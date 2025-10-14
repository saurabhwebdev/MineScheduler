const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const maintenanceController = require('../controllers/maintenanceController');

// @route   GET /api/maintenance/overview
// @desc    Get maintenance overview for all equipment
// @access  Private
router.get('/overview', protect, maintenanceController.getMaintenanceOverview);

// @route   PUT /api/maintenance/equipment/:id/hours
// @desc    Update equipment operating hours
// @access  Private
router.put('/equipment/:id/hours', protect, maintenanceController.updateOperatingHours);

// @route   POST /api/maintenance/equipment/:id/reset
// @desc    Reset equipment maintenance after maintenance completed
// @access  Private
router.post('/equipment/:id/reset', protect, maintenanceController.resetMaintenance);

module.exports = router;
