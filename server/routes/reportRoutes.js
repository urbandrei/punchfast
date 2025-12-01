const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { optionalAuth, requireAdmin } = require('../middleware/authMiddleware');

// Public route - Create a report (allows guest and authenticated users)
router.post('/', optionalAuth, reportController.createReport);

// Admin routes - Get all reports and update report status
router.get('/', requireAdmin, reportController.getAllReports);
router.put('/:reportId', requireAdmin, reportController.updateReportStatus);

module.exports = router;
