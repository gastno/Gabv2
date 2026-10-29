const express = require('express');
const notificationController = require('../controllers/staffNotificationController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authenticateToken, requireRole('staff', 'admin', 'super_admin'));
router.get('/', notificationController.listNotifications);
router.patch('/read', notificationController.markNotificationsRead);

module.exports = router;
