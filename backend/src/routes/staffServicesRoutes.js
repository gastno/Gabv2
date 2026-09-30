// src/routes/staffServicesRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const staffServicesController = require('../controllers/staffServicesController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Public/Authenticated reading endpoint
router.get('/:staffId/services', staffServicesController.getStaffServices);
router.get('/by-service/:serviceId', staffServicesController.getStaffByService);

// Protected administrative endpoints (Admin / SuperAdmin only)
router.put(
  '/:staffId/services',
  authenticateToken,
  requireRole('admin', 'super_admin'),
  staffServicesController.syncStaffServices
);

router.post(
  '/:staffId/services/:serviceId',
  authenticateToken,
  requireRole('admin', 'super_admin'),
  staffServicesController.assignService
);

router.delete(
  '/:staffId/services/:serviceId',
  authenticateToken,
  requireRole('admin', 'super_admin'),
  staffServicesController.removeService
);

module.exports = router;