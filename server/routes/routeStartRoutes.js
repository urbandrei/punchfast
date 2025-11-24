const express = require('express');
const router = express.Router();
const routeStartController = require('../controllers/routeStartController');

router.get('/user/:userId', routeStartController.getUserRouteStarts);

router.post('/start', routeStartController.startRoute);

router.put('/leave', routeStartController.leaveRoute);

module.exports = router;
