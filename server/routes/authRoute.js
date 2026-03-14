const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Rate limit: max 10 OTP requests per 15 minutes per IP
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { status: 'error', message: 'Too many OTP requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Route for user registration
router.post('/send-otp', otpLimiter, authController.sendOTP);
router.post('/verify-otp', otpLimiter, authController.verifyOTP);
router.get('/logout', authController.logout);

// Route for updating user profile
router.put('/update-profile', otpLimiter, authMiddleware, authController.updateProfile);
router.get('/check-authenticated', otpLimiter, authMiddleware, authController.checkAuthenticated);
router.get('/users', otpLimiter, authMiddleware, authController.getAllUsers);

module.exports = router;
