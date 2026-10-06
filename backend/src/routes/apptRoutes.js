const express = require('express');
const router = express.Router();
const apptController = require('../controllers/apptController');
const availabilityController = require('../controllers/availabilityController');
const { authenticateToken, optionalAuthenticateToken, requireRole } = require('../middleware/authMiddleware');

router.get('/availability', availabilityController.getAvailability);

// Public route: Guest or Logged-in customer creates booking
router.post('/', optionalAuthenticateToken, apptController.createAppointment);

router.get('/', authenticateToken, apptController.listAppointments);
router.get('/:id', authenticateToken, apptController.getAppointment);
router.patch('/:id/status', authenticateToken, requireRole('staff', 'admin', 'super_admin'), apptController.updateAppointmentStatus);
router.patch('/:id/fee-status', authenticateToken, requireRole('staff', 'admin', 'super_admin'), apptController.updateAppointmentFeeStatus);
router.patch('/:id/payment-status', authenticateToken, requireRole('staff', 'admin', 'super_admin'), apptController.updateAppointmentPaymentStatus);
router.post('/:id/cancel', authenticateToken, apptController.cancelAppointment);

module.exports = router;