const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getMaintenanceLogs,
  getSingleMaintenanceLog,
  createMaintenanceLog,
  updateMaintenanceLog,
  deleteMaintenanceLog,
  getMaintenanceStats,
  exportMaintenanceLogs,
  importMaintenanceLogs,
  getUpcomingMaintenance
} = require('../controllers/maintenanceLogController');

// Protect all routes
router.use(protect);

// @route   GET /api/maintenance-logs/stats
// @desc    Get maintenance statistics
// @access  Private
router.get('/stats', getMaintenanceStats);

// @route   GET /api/maintenance-logs/export
// @desc    Export maintenance logs to JSON
// @access  Private
router.get('/export', exportMaintenanceLogs);

// @route   POST /api/maintenance-logs/import
// @desc    Import maintenance logs from JSON
// @access  Private
router.post('/import', importMaintenanceLogs);

// @route   GET /api/maintenance-logs/upcoming
// @desc    Get upcoming maintenance
// @access  Private
router.get('/upcoming', getUpcomingMaintenance);

// @route   GET /api/maintenance-logs
// @desc    Get all maintenance logs with filters
// @access  Private
// @route   POST /api/maintenance-logs
// @desc    Create new maintenance log
// @access  Private
router.route('/')
  .get(getMaintenanceLogs)
  .post(createMaintenanceLog);

// @route   GET /api/maintenance-logs/:id
// @desc    Get single maintenance log
// @access  Private
// @route   PUT /api/maintenance-logs/:id
// @desc    Update maintenance log
// @access  Private
// @route   DELETE /api/maintenance-logs/:id
// @desc    Delete maintenance log
// @access  Private
router.route('/:id')
  .get(getSingleMaintenanceLog)
  .put(updateMaintenanceLog)
  .delete(deleteMaintenanceLog);

module.exports = router;
