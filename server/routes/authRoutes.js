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
const auth = require("../middleware/auth");

router.get("/secure-data", auth, controllerFunction);

router.post('/login', authController.login);
router.post('/signup', authController.signup);
router.post('/business/login', authController.businessLogin);
router.post('/business/signup', authController.businessSignup);
router.post('/change-password', authController.changePassword);

router.post('/punch', punchesController.punch);

router.get('/stores/nearby', storeController.getNearbyStores);
router.post('/stores', storeController.newStore);

router.post('/routes', routeController.newRoute);
router.get('/routes/nearby', routeController.getNearbyRoutes);

router.post('/visits', visitController.createVisit);
router.get('/visits/store-stats', visitController.getStoreVisitStats);
router.get('/visits/route-progress', visitController.getRouteVisitProgress);

router.post('/route-starts', routeStartController.startRoute);
router.put('/route-starts/leave', routeStartController.leaveRoute);
router.get('/users/:userId/route-starts', routeStartController.getUserRouteStarts);

router.post('/saved-stores/toggle', savedStoresController.toggleSavedStore);
router.get('/saved-stores/:userId', savedStoresController.getUserSavedStores);
router.get('/saved-stores/:userId/:storeId', savedStoresController.checkStoreSaved);

router.get('/nearby-eligible-stores', nearbyEligibleStoresController.getNearbyEligibleStores);
router.post("/send-otp", authController.sendOTP);
router.post("/verify-otp", authController.verifyOTP);

router.post("/signup", authController.signup);
router.post("/login", authController.login);

router.post("/businessSignup", authController.businessSignup);
router.post("/businessLogin", authController.businessLogin);

router.post("/changePassword", authController.changePassword);
router.post("/logout", authController.logout);


module.exports = router;
