// src/routes/brandRoutes.js
const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Public route: Fetch all active brands
router.get('/', brandController.getAllBrands);

// Protected route: Edit a brand (Admin or SuperAdmin only)
router.put(
  '/:id',
  authenticateToken,
  requireRole('admin', 'super_admin'),
  brandController.updateBrand
);

module.exports = router;