const express = require('express');
const router = express.Router();
const routeStartController = require('../controllers/routeStartController');

router.get('/joined/:userId', routeStartController.getUserRouteStarts);

module.exports = router;