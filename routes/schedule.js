const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const scheduleController = require('../controllers/scheduleController');

/**
 * @route   POST /api/schedule/generate
 * @desc    Generate schedule grid
 * @access  Private
 */
router.post('/generate', protect, scheduleController.generateSchedule);

/**
 * @route   GET /api/schedule/latest
 * @desc    Get the latest generated schedule
 * @access  Private
 */
router.get('/latest', protect, scheduleController.getLatestSchedule);

/**
 * @route   GET /api/schedule/history
 * @desc    Get schedule generation history
 * @access  Private
 */
router.get('/history', protect, scheduleController.getScheduleHistory);

/**
 * @route   PUT /api/schedule/sites/:siteId/toggle
 * @desc    Toggle site active/inactive status
 * @access  Private
 */
router.put('/sites/:siteId/toggle', protect, scheduleController.toggleSiteStatus);

module.exports = router;
