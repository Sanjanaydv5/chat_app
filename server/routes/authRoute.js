const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Route for user registration
router.post('/send-otp', authController.sendOTP);
router.post('/verify-otp', authController.verifyOTP);
router.get('/logout', authController.logout);

// Route for updating user profile
router.put('/update-profile', authMiddleware, authController.updateProfile);
router.get('/check-authenticated', authMiddleware, authController.checkAuthenticated);
router.get('/users', authMiddleware, authController.getAllUsers);

module.exports = router;
//