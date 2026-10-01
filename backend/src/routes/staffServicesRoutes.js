// src/routes/staffServicesRoutes.js
const express = require('express');
const router = express.Router();
const staffServicesController = require('../controllers/staffServicesController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Public/Authenticated reading routes
router.get('/by-staff/:staffId', staffServicesController.getStaffServices);
router.get('/by-service/:serviceId', staffServicesController.getStaffByService);

// Protected routes (Admin / SuperAdmin only)
router.use(authenticateToken);
router.use(requireRole('admin', 'super_admin'));

// Bulk Sync routes
router.put('/by-staff/:staffId', staffServicesController.syncStaffServices);
router.put('/by-service/:serviceId', staffServicesController.syncServiceWorkers);

// Single item assignment routes
router.post('/:staffId/:serviceId', staffServicesController.assignService);
router.delete('/:staffId/:serviceId', staffServicesController.removeService);

module.exports = router;