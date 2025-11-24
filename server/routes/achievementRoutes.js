const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievementController');

router.get('/', achievementController.getAllAchievements);

router.get('/user/:userId', achievementController.getUserAchievements);

router.post('/award', achievementController.awardAchievement);

module.exports = router;
