const express = require('express');
const router = express.Router();
const apptController = require('../controllers/apptController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Public route: Guest or Logged-in customer creates booking
router.post('/', apptController.createAppointment);

// Protected route: Only staff or admins can view staff schedules / appointments
router.get('/staff-schedule', authenticateToken, requireRole('staff', 'admin', 'super_admin'), (req, res) => {
  res.json({ message: 'Welcome to the protected staff schedule route', staffUser: req.user });
});

module.exports = router;