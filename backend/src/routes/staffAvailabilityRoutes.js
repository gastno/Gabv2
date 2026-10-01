const express = require('express');
const router = express.Router();
const controller = require('../controllers/staffAvailabilityController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.use(authenticateToken);
router.get('/me/availability/:date', requireRole('staff', 'admin', 'super_admin'), controller.getSelfAvailability);
router.put('/me/availability/:date', requireRole('staff', 'admin', 'super_admin'), controller.replaceSelfAvailability);
router.post('/me/unavailabilities', requireRole('staff', 'admin', 'super_admin'), controller.addSelfUnavailability);
router.delete('/me/unavailabilities/:id', requireRole('staff', 'admin', 'super_admin'), controller.removeSelfUnavailability);
router.get('/:staffId', requireRole('admin', 'super_admin'), controller.getStaffAvailabilityForAdmin);

module.exports = router;