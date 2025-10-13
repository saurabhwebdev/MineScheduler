const express = require('express');
const router = express.Router();
const {
  getConstants,
  getConstant,
  createConstant,
  updateConstant,
  deleteConstant,
  getConstantStats
} = require('../controllers/constantsController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Public routes (authenticated users)
router.get('/', getConstants);
router.get('/stats', getConstantStats);
router.get('/:id', getConstant);

// Admin-only routes
router.post('/', authorize('admin'), createConstant);
router.put('/:id', authorize('admin'), updateConstant);
router.delete('/:id', authorize('admin'), deleteConstant);

module.exports = router;
