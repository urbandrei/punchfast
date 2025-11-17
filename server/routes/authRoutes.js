const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth");

const authController = require('../controllers/authController');

router.post("/request-login-otp", authController.requestLoginOtp);
router.post("/verify-login-otp", authController.verifyLoginOtp);

router.post("/signup", authController.signup);
router.post("/businessSignup", authController.businessSignup);

router.post("/logout", authController.logout);

module.exports = router;
