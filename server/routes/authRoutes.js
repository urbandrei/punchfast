const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/signup", authController.signup);
router.post("/business-signup", authController.businessSignup);

router.post("/login/request-otp", authController.requestLoginOtp);
router.post("/login/verify-otp", authController.verifyLoginOtp);

router.post("/forgot-password", authController.forgotPassword);
router.post("/verify-reset-otp", authController.verifyResetOtp);
router.post("/reset-password", authController.resetPassword);

router.post("/logout", authController.logout);

module.exports = router;

