const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Admin dashboard stats
router.get('/stats', adminController.getAdminStats);

// Business approval management
router.get('/pending-businesses', adminController.getPendingBusinesses);
router.post('/approve-business', adminController.adminApproveBusiness);
router.post('/deny-business', adminController.adminDenyBusiness);

// Store management for business approval
router.get('/search-stores', adminController.searchStores);
router.post('/create-store', adminController.adminCreateStore);

module.exports = router;
