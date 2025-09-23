const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/signup', authController.signup);
router.post('/business/login', authController.businessLogin);  
router.post('/business/signup', authController.businessSignup);

module.exports = router;