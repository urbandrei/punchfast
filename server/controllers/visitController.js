const { User, Store, Visit, RouteStart } = require('../models/associations');
const { Op } = require('sequelize');

exports.createVisit = async (req, res) => {
    const { userId, storeId, visitDate } = req.body;

    if (!userId || !storeId) {
        return res.status(400).json({ message: 'Missing required fields: userId, storeId' });
    }

    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const store = await Store.findByPk(storeId);
        if (!store) {
            return res.status(404).json({ message: 'Store not found' });
        }

        const visitData = { userId, storeId };
        if (visitDate) {
            visitData.visitDate = new Date(visitDate);
        }

        const visit = await Visit.create(visitData);

        const completeVisit = await Visit.findByPk(visit.id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username']
                },
                {
                    model: Store,
                    as: 'store',
                    attributes: ['id', 'name', 'address', 'latitude', 'longitude']
                }
            ]
        });

        return res.status(201).json({ message: 'Visit created', visit: completeVisit });
    } catch (error) {
        console.error('Visit creation error:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getStoreVisitStats = async (req, res) => {
    const { userId, storeId } = req.query;

    if (!userId || !storeId) {
        return res.status(400).json({ message: 'Missing required parameters: userId, storeId' });
    }

    try {
        // Get total visit count
        const totalVisits = await Visit.count({
            where: { userId, storeId }
        });

        // Get today's visits
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const visitedToday = await Visit.count({
            where: {
                userId,
                storeId,
                visitDate: {
                    [Op.gte]: today,
                    [Op.lt]: tomorrow
                }
            }
        }) > 0;

        return res.status(200).json({
            totalVisits,
            visitedToday
        });
    } catch (error) {
        console.error('Error fetching store visit stats:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getRouteVisitProgress = async (req, res) => {
    const { userId, routeId } = req.query;

    if (!userId || !routeId) {
        return res.status(400).json({ message: 'Missing required parameters: userId, routeId' });
    }

    try {
        // Get the route start to find when user joined the route
        const routeStart = await RouteStart.findOne({
            where: { userId, routeId },
            order: [['startDate', 'DESC']]
        });

        if (!routeStart) {
            return res.status(200).json({ visitedStoreIds: [] });
        }

        // Get visits to any store since the route was started
        const visits = await Visit.findAll({
            where: {
                userId,
                visitDate: {
                    [Op.gte]: routeStart.startDate
                }
            },
            attributes: ['storeId', 'visitDate']
        });

        const visitedStoreIds = [...new Set(visits.map(v => v.storeId))];

        return res.status(200).json({ visitedStoreIds });
    } catch (error) {
        console.error('Error fetching route visit progress:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};