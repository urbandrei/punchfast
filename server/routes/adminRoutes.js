const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/authMiddleware');

// Apply requireAdmin middleware to ALL admin routes
router.use(requireAdmin);

// Admin dashboard stats
router.get('/stats', adminController.getAdminStats);

// Business approval management
router.get('/pending-businesses', adminController.getPendingBusinesses);
router.post('/approve-business', adminController.adminApproveBusiness);
router.post('/deny-business', adminController.adminDenyBusiness);

// Store management for business approval
router.get('/search-stores', adminController.searchStores);
router.post('/create-store', adminController.adminCreateStore);

// Store moderation (user-submitted stores)
router.get('/pending-stores', adminController.getPendingStores);
router.put('/stores/:storeId', adminController.updateStore);
router.put('/stores/:storeId/status', adminController.updateStoreStatus);

// Questionnaire settings and stats
router.get('/questionnaire/settings', adminController.getQuestionnaireSettings);
router.put('/questionnaire/settings', adminController.updateQuestionnaireSettings);
router.get('/questionnaire/stats', adminController.getQuestionnaireStats);

module.exports = router;
