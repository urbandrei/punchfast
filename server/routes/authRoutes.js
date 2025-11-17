const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');


// LOGIN OTP
router.post('/request-login-otp', authController.requestLoginOtp);
router.post('/verify-login-otp', authController.verifyLoginOtp);

// SIGNUP
router.post('/signup', authController.signup);
router.post('/businessSignup', authController.businessSignup);

// FORGOT PASSWORD
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-otp', authController.verifyResetOtp);
router.post('/reset-password', authController.resetPassword);

// LOGOUT
router.post('/logout', authController.logout);

module.exports = router;
