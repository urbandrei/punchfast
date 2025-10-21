const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const punchesController = require('../controllers/punchesController');
const storeController = require('../controllers/storeController');


router.post('/login', authController.login);
router.post('/signup', authController.signup);
router.post('/business/login', authController.businessLogin);  
router.post('/business/signup', authController.businessSignup);
router.post('/punch',punchesController.punch);
router.get('/nearby', storeController.getNearbyStores);
router.post('/newstore', storeController.newStore);

module.exports = router;