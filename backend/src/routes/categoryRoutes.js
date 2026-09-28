// src/routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Public route to view all categories
router.get('/', categoryController.getAllCategories);

// Protected routes (Admin / SuperAdmin only)
router.post(
  '/',
  authenticateToken,
  requireRole('admin', 'super_admin'),
  categoryController.createCategory
);

router.put(
  '/:id',
  authenticateToken,
  requireRole('admin', 'super_admin'),
  categoryController.updateCategory
);

module.exports = router;