const express = require('express');
const router = express.Router();
const {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  getAvailableRoutes
} = require('../controllers/roleController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// Get available routes (for dropdown)
router.get('/available-routes', getAvailableRoutes);

// CRUD routes
router.get('/', getRoles);
router.get('/:id', getRole);
router.post('/', createRole);
router.put('/:id', updateRole);
router.delete('/:id', deleteRole);

module.exports = router;
