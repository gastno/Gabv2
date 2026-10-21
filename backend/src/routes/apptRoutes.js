const express = require('express');
const router = express.Router();
const apptController = require('../controllers/apptController');
const availabilityController = require('../controllers/availabilityController');
const { authenticateToken, optionalAuthenticateToken, requireRole } = require('../middleware/authMiddleware');
const { uploadAppointmentReferences } = require('../middleware/uploadMiddleware');

const handleReferenceUploads = (req, res, next) => {
  uploadAppointmentReferences.array('reference_images', 5)(req, res, error => {
    if (error) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'Each reference image must be 5MB or smaller.' });
      }
      if (error.code === 'LIMIT_FILE_COUNT'
          || (error.code === 'LIMIT_UNEXPECTED_FILE' && error.field === 'reference_images')) {
        return res.status(413).json({ error: 'A maximum of 5 reference images may be uploaded.' });
      }
      if (error.code === 'LIMIT_FIELD_COUNT' || error.code === 'LIMIT_PART_COUNT') {
        return res.status(413).json({ error: 'The booking form contains too many fields or parts.' });
      }
      return res.status(400).json({ error: error.message });
    }
    return next();
  });
};

router.get('/availability', availabilityController.getAvailability);

// Public route: Guest or Logged-in customer creates booking
router.post('/', optionalAuthenticateToken, handleReferenceUploads, apptController.createAppointment);

router.get('/', authenticateToken, apptController.listAppointments);
router.get('/:id', authenticateToken, apptController.getAppointment);
router.get('/:id/references/:referenceId', authenticateToken, apptController.getAppointmentReferenceImage);
router.patch('/:id/status', authenticateToken, requireRole('staff', 'admin', 'super_admin'), apptController.updateAppointmentStatus);
router.patch('/:id/fee-status', authenticateToken, requireRole('staff', 'admin', 'super_admin'), apptController.updateAppointmentFeeStatus);
router.patch('/:id/payment-status', authenticateToken, requireRole('staff', 'admin', 'super_admin'), apptController.updateAppointmentPaymentStatus);
router.post('/:id/cancel', authenticateToken, apptController.cancelAppointment);

module.exports = router;