const { User, Store, Route, Report } = require('../models/associations');

/**
 * Create a new report (public endpoint - allows guest reports)
 * @route POST /api/reports
 * @access Public (with optional auth)
 */
exports.createReport = async (req, res) => {
    const { reportedItemType, reportedItemId, category, description } = req.body;

    // Validation
    if (!reportedItemType || !reportedItemId || !category) {
        return res.status(400).json({
            message: 'Missing required fields: reportedItemType, reportedItemId, category'
        });
    }

    // Validate reportedItemType
    if (!['store', 'route'].includes(reportedItemType)) {
        return res.status(400).json({
            message: 'Invalid reportedItemType. Must be "store" or "route"'
        });
    }

    // Validate category
    const validCategories = [
        'closed_permanently',
        'wrong_location',
        'duplicate',
        'inappropriate_content',
        'spam',
        'other'
    ];
    if (!validCategories.includes(category)) {
        return res.status(400).json({
            message: 'Invalid category'
        });
    }

    try {
        // Verify the reported item exists
        if (reportedItemType === 'store') {
            const store = await Store.findByPk(reportedItemId);
            if (!store) {
                return res.status(404).json({ message: 'Store not found' });
            }
        } else if (reportedItemType === 'route') {
            const route = await Route.findByPk(reportedItemId);
            if (!route) {
                return res.status(404).json({ message: 'Route not found' });
            }
        }

        // Get reporterId from authenticated user (if available)
        const reporterId = req.user ? req.user.id : null;

        // Create the report
        const report = await Report.create({
            reportedItemType,
            reportedItemId,
            reporterId,
            category,
            description: description || null,
            status: 'pending'
        });

        return res.status(201).json({
            message: 'Report submitted successfully',
            report: {
                id: report.id,
                reportedItemType: report.reportedItemType,
                reportedItemId: report.reportedItemId,
                category: report.category,
                status: report.status,
                createdAt: report.createdAt
            }
        });

    } catch (error) {
        console.error('Report creation error:', error);
        return res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Get all reports (admin only)
 * @route GET /api/reports
 * @access Admin
 */
exports.getAllReports = async (req, res) => {
    const { status, reportedItemType } = req.query;

    try {
        const whereClause = {};

        // Filter by status if provided
        if (status) {
            if (!['pending', 'reviewed', 'resolved', 'dismissed'].includes(status)) {
                return res.status(400).json({ message: 'Invalid status filter' });
            }
            whereClause.status = status;
        }

        // Filter by reportedItemType if provided
        if (reportedItemType) {
            if (!['store', 'route'].includes(reportedItemType)) {
                return res.status(400).json({ message: 'Invalid reportedItemType filter' });
            }
            whereClause.reportedItemType = reportedItemType;
        }

        const reports = await Report.findAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'reporter',
                    attributes: ['id', 'username']
                },
                {
                    model: User,
                    as: 'reviewer',
                    attributes: ['id', 'username']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        // Enrich reports with store/route names
        const enrichedReports = await Promise.all(reports.map(async (report) => {
            const reportData = report.toJSON();

            if (report.reportedItemType === 'store') {
                const store = await Store.findByPk(report.reportedItemId, {
                    attributes: ['id', 'name', 'address']
                });
                reportData.reportedItem = store;
            } else if (report.reportedItemType === 'route') {
                const route = await Route.findByPk(report.reportedItemId, {
                    attributes: ['id', 'name', 'routeType']
                });
                reportData.reportedItem = route;
            }

            return reportData;
        }));

        return res.status(200).json({
            reports: enrichedReports
        });

    } catch (error) {
        console.error('Error fetching reports:', error);
        return res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Update report status (admin only)
 * @route PUT /api/reports/:reportId
 * @access Admin
 */
exports.updateReportStatus = async (req, res) => {
    const { reportId } = req.params;
    const { status, adminNotes } = req.body;

    // Validation
    if (!status) {
        return res.status(400).json({ message: 'Missing required field: status' });
    }

    if (!['pending', 'reviewed', 'resolved', 'dismissed'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        const report = await Report.findByPk(reportId);

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        // Update report
        report.status = status;
        if (adminNotes) {
            report.adminNotes = adminNotes;
        }
        report.reviewedBy = req.user.id;
        report.reviewedAt = new Date();

        await report.save();

        // Fetch updated report with associations
        const updatedReport = await Report.findByPk(reportId, {
            include: [
                {
                    model: User,
                    as: 'reporter',
                    attributes: ['id', 'username']
                },
                {
                    model: User,
                    as: 'reviewer',
                    attributes: ['id', 'username']
                }
            ]
        });

        return res.status(200).json({
            message: 'Report updated successfully',
            report: updatedReport
        });

    } catch (error) {
        console.error('Error updating report:', error);
        return res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};
