const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getEquipment,
  getSingleEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  importEquipment,
  exportEquipment,
  logMaintenance,
  getMaintenanceHistory,
  getEquipmentStats
} = require('../controllers/equipmentController');

// Protect all routes
router.use(protect);

router.route('/')
  .get(getEquipment)
  .post(createEquipment);

router.route('/stats')
  .get(getEquipmentStats);

router.route('/import')
  .post(importEquipment);

router.route('/export')
  .get(exportEquipment);

router.route('/:id')
  .get(getSingleEquipment)
  .put(updateEquipment)
  .delete(deleteEquipment);

router.route('/:id/maintenance')
  .post(logMaintenance);

router.route('/:id/history')
  .get(getMaintenanceHistory);

module.exports = router;
