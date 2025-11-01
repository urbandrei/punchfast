const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const businessController = require('../controllers/businessController');
const punchesController = require('../controllers/punchesController');
const storeController = require('../controllers/storeController');
const routeController = require('../controllers/routeController');
// const visitController = require('../controllers/visitController');
// const routeStartController = require('../controllers/routeStartController');

// ------- user auth -------
router.post('/login', authController.login);
router.post('/signup', authController.signup);

// ------- business auth -------
router.post('/business/login', businessController.login);
router.post('/business/signup', businessController.signup);

// simple admin token check
const requireAdmin = (req, res, next) => {
  if (req.headers['x-admin-token'] !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  next();
};

//  list businesses for admin (pending)
router.get('/admin/businesses', requireAdmin, businessController.list);

// Admin approve by id 
router.post('/admin/businesses/:id/approve', requireAdmin, businessController.approve);

router.post('/business/:id/approve', requireAdmin, businessController.approve);-
router.get('/stores/nearby', storeController.getNearbyStores);
router.post('/stores', storeController.newStore);
router.get('/stores/:id/name', storeController.getStoreNameById);

router.post('/routes', routeController.newRoute);
router.get('/routes', routeController.getRoutes);
router.get('/routes/nearby', routeController.getNearbyRoutes);
router.get('/routes/:id', routeController.getRouteById);

// Temporarily disabled RouteStart routes
// router.post('/route-starts', routeStartController.startRoute);
// router.get('/users/:userId/route-starts', routeStartController.getUserRouteStarts);
// router.get('/users/:userId/active-routes', routeStartController.getUserActiveRoutes);
// router.get('/routes/:routeId/starts', routeStartController.getRouteStarts);

module.exports = router;
