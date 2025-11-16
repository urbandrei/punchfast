const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const punchesController = require('../controllers/punchesController');
const storeController = require('../controllers/storeController');
const routeController = require('../controllers/routeController');
const visitController = require('../controllers/visitController');
const routeStartController = require('../controllers/routeStartController');
const savedStoresController = require('../controllers/savedStoresController');
const nearbyEligibleStoresController = require('../controllers/nearbyEligibleStoresController');

// ---- auth (customers) ----
router.post('/login', authController.login);
router.post('/signup', authController.signup);
router.post('/change-password', authController.changePassword);

// ---- auth (businesses) ----
router.post('/business/login', authController.businessLogin);
router.post('/business/signup', authController.businessSignup);

// admin-ish business approval + offer config
router.post('/approve-business', authController.approveBusiness);
router.get('/business-offer', authController.getBusinessOffer);
router.put('/business-offer', authController.updateBusinessOffer);

// ---- punches ----
router.post('/punch', punchesController.punch);

// ---- stores ----
router.get('/stores/nearby', storeController.getNearbyStores);
router.post('/stores', storeController.newStore);

// ---- routes ----
router.post('/routes', routeController.newRoute);
router.get('/routes/nearby', routeController.getNearbyRoutes);

// ---- visits ----
router.post('/visits', visitController.createVisit);
router.get('/visits/store-stats', visitController.getStoreVisitStats);
router.get('/visits/route-progress', visitController.getRouteVisitProgress);

// ---- route starts ----
router.post('/route-starts', routeStartController.startRoute);
router.put('/route-starts/leave', routeStartController.leaveRoute);
router.get('/users/:userId/route-starts', routeStartController.getUserRouteStarts);

// ---- saved stores ----
router.post('/saved-stores/toggle', savedStoresController.toggleSavedStore);
router.get('/saved-stores/:userId', savedStoresController.getUserSavedStores);
router.get('/saved-stores/:userId/:storeId', savedStoresController.checkStoreSaved);

// ---- nearby eligible stores ----
router.get('/nearby-eligible-stores', nearbyEligibleStoresController.getNearbyEligibleStores);

module.exports = router;
