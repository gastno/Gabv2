const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { uploadAvatar } = require('../middleware/uploadMiddleware');

router.use(authenticateToken);
router.use(requireRole('admin', 'super_admin'));

const handleMulterUpload = (fieldname) => (req, res, next) => {
  uploadAvatar.single(fieldname)(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File size exceeds the 5MB limit.' });
      }
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

router.get('/', staffController.getAllStaff);
router.post('/', handleMulterUpload('avatar'), staffController.createStaff);
router.put('/:id', handleMulterUpload('avatar'), staffController.updateStaff);
router.post('/:id/avatar', handleMulterUpload('avatar'), staffController.uploadAvatar);

module.exports = router;