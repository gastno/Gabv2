const express = require('express');
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();
router.patch('/read', authenticateToken, notificationController.markNotificationsRead);

module.exports = router;
