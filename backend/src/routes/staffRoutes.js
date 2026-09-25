// src/routes/staffRoutes.js
const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { uploadAvatar } = require('../middleware/uploadMiddleware');

// Protect all staff management routes so only admin or super_admin can access them
router.use(authenticateToken);
router.use(requireRole('admin', 'super_admin'));

// GET /api/staff - List all staff accounts
router.get('/', staffController.getAllStaff);

// POST /api/staff - Create a new staff account
router.post('/', staffController.createStaff);

// PUT /api/staff/:id - Edit an existing staff account
router.put('/:id', staffController.updateStaff);

// POST /api/staff/:id/avatar - Upload staff profile picture
router.post(
  '/:id/avatar',
  (req, res, next) => {
    // Multer error handling wrapper
    uploadAvatar.single('avatar')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ error: 'File size exceeds the 5MB limit.' });
        }
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  staffController.uploadAvatar
);

module.exports = router;