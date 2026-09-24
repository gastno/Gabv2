const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Public auth routes
router.post('/staff/login', authController.staffLogin);
router.post('/customer/register', authController.registerCustomer);
router.post('/customer/login', authController.customerLogin);

// Token Verification Route (used by frontend React app on reload)
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;