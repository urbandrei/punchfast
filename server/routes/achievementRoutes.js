const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievementController');

router.get('/', achievementController.getAllAchievements);

router.get('/user/:userId', achievementController.getUserAchievements);

router.get('/all-with-progress/:userId', achievementController.getAllAchievementsWithProgress);

router.get('/newly-unlocked/:userId', achievementController.getNewlyUnlocked);

router.post('/award', achievementController.awardAchievement);

router.post('/mark-shown', achievementController.markAsShown);

module.exports = router;
