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
 * @route   PUT /api/schedule/sites/:siteId/toggle
 * @desc    Toggle site active/inactive status
 * @access  Private
 */
router.put('/sites/:siteId/toggle', protect, scheduleController.toggleSiteStatus);

module.exports = router;
