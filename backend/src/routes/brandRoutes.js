// src/routes/brandRoutes.js
const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { requireBrandAccess } = require('../middleware/brandAccessMiddleware');
const { uploadAvatar } = require('../middleware/uploadMiddleware');

// Public route: Fetch all active brands
router.get('/', brandController.getAllBrands);
router.get('/:id/portfolio', brandController.getBrandPortfolio);

const requireBrandAdmin = [authenticateToken, requireRole('admin', 'super_admin'), requireBrandAccess];
const handleImageUpload = (fieldName) => (req, res, next) => {
  uploadAvatar.single(fieldName)(req, res, error => {
    if (error) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File size exceeds the 5MB limit.' });
      }
      return res.status(400).json({ error: error.message });
    }
    return next();
  });
};

router.put('/:id', ...requireBrandAdmin, brandController.updateBrand);
router.post(
  '/:id/logo',
  ...requireBrandAdmin,
  handleImageUpload('image'),
  brandController.uploadBrandImage.bind(null, 'logo')
);
router.post(
  '/:id/cover',
  ...requireBrandAdmin,
  handleImageUpload('image'),
  brandController.uploadBrandImage.bind(null, 'cover')
);
router.post(
  '/:id/portfolio/images',
  ...requireBrandAdmin,
  handleImageUpload('image'),
  brandController.uploadPortfolioImage
);
router.delete(
  '/:id/portfolio/images/:imageId',
  ...requireBrandAdmin,
  brandController.deletePortfolioImage
);
router.put('/:id/portfolio', ...requireBrandAdmin, brandController.updatePortfolio);

module.exports = router;