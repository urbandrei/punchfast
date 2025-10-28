const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const punchesController = require('../controllers/punchesController');
const storeController = require('../controllers/storeController');
const routeController = require('../controllers/routeController');
const visitController = require('../controllers/visitController');
const routeStartController = require('../controllers/routeStartController');

router.post('/login', authController.login);
router.post('/signup', authController.signup);
router.post('/business/login', authController.businessLogin);
router.post('/business/signup', authController.businessSignup);

router.post('/punch', punchesController.punch);

router.get('/stores/nearby', storeController.getNearbyStores);
router.post('/stores', storeController.newStore);
router.get('/stores/:id/name', storeController.getStoreNameById);

router.post('/routes', routeController.newRoute);
router.get('/routes', routeController.getRoutes);
router.get('/routes/nearby', routeController.getNearbyRoutes);
router.get('/routes/:id', routeController.getRouteById);

router.post('/visits', visitController.createVisit);
router.get('/users/:userId/visits', visitController.getUserVisits);
router.get('/users/:userId/visit-stats', visitController.getUserVisitStats);
router.get('/stores/:storeId/visits', visitController.getStoreVisits);

router.post('/route-starts', routeStartController.startRoute);
router.get('/users/:userId/route-starts', routeStartController.getUserRouteStarts);
router.get('/users/:userId/active-routes', routeStartController.getUserActiveRoutes);
router.get('/routes/:routeId/starts', routeStartController.getRouteStarts);

module.exports = router;