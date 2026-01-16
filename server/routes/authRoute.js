const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Route for user registration
router.post('/send-otp', authController.sendOTP);
router.post('/verify-otp', authController.verifyOTP);

// Route for updating user profile
router.put('/update-profile', authMiddleware.multerMiddleware, authController.updateProfile);

module.exports = router;