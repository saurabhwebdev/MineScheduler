const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getDashboardMetrics,
  getDashboardTrends,
  getEquipmentPerformance
} = require('../controllers/dashboardController');

// All routes are protected
router.use(protect);

// @route   GET /api/dashboard/metrics
// @desc    Get comprehensive dashboard metrics
// @access  Private
router.get('/metrics', getDashboardMetrics);

// @route   GET /api/dashboard/trends
// @desc    Get dashboard trends and historical data
// @access  Private
router.get('/trends', getDashboardTrends);

// @route   GET /api/dashboard/equipment-performance
// @desc    Get equipment performance for 24-hour timeline
// @access  Private
router.get('/equipment-performance', getEquipmentPerformance);

module.exports = router;
