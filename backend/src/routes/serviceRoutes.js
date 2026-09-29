// src/routes/serviceRoutes.js
const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { uploadAvatar } = require('../middleware/uploadMiddleware');

// Public reading route
router.get('/', serviceController.getAllServices);

// Protected routes (Admin / SuperAdmin)
router.post(
  '/',
  authenticateToken,
  requireRole('admin', 'super_admin'),
  serviceController.createService
);

router.post(
  '/:id/image',
  authenticateToken,
  requireRole('admin', 'super_admin'),
  (req, res, next) => {
    uploadAvatar.single('image')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ error: 'File size exceeds the 5MB limit.' });
        }
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  serviceController.uploadServiceImage
);

router.put(
  '/:id',
  authenticateToken,
  requireRole('admin', 'super_admin'),
  serviceController.updateService
);

module.exports = router;