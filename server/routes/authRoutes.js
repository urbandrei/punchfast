const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const punchesController = require('../controllers/punchesController');

router.post('/login', authController.login);
router.post('/signup', authController.signup);
router.post('/business/login', authController.businessLogin);  
router.post('/business/signup', authController.businessSignup);
router.post('/punch',punchesController.punch);

module.exports = router;