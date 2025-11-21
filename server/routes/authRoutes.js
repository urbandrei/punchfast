const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login/request-otp', authController.requestLoginOtp);
router.post('/login/verify-otp', authController.verifyLoginOtp);

router.post('/signup', authController.signup);
router.post('/signup/business', authController.businessSignup);

router.post('/password/forgot', authController.forgotPassword);
router.post('/password/verify-otp', authController.verifyResetOtp);
router.post('/password/reset', authController.resetPassword);

router.post('/logout', authController.logout);

module.exports = router;




