const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getSites,
  getSite,
  createSite,
  updateSite,
  deleteSite,
  toggleSiteStatus,
  importSites,
  exportSites,
  getSiteStats
} = require('../controllers/siteController');

// Protect all routes
router.use(protect);

router.route('/')
  .get(getSites)
  .post(createSite);

router.route('/stats')
  .get(getSiteStats);

router.route('/import')
  .post(importSites);

router.route('/export')
  .get(exportSites);

router.route('/:id')
  .get(getSite)
  .put(updateSite)
  .delete(deleteSite);

router.route('/:id/toggle')
  .put(toggleSiteStatus);

module.exports = router;
