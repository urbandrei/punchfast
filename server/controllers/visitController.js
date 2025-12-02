const { User, Store, Visit, RouteStart, Achievement, UserAchievement, SystemSettings } = require('../models/associations');
const { Op } = require('sequelize');

exports.createVisit = async (req, res) => {
    const { userId, storeId, visitDate } = req.body;

    if (!userId || !storeId) {
        return res.status(400).json({ message: 'Missing required fields: userId, storeId' });
    }

    try {
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const store = await Store.findByPk(storeId);
        if (!store) return res.status(404).json({ message: 'Store not found' });

        // Dynamic probability trigger for questionnaire (default 5%)
        const rateSetting = await SystemSettings.findByPk('questionnaire_rate');
        const questionnaireRate = rateSetting ? parseFloat(rateSetting.value) : 0.05;
        const shouldShowQuestionnaire = Math.random() < questionnaireRate;

        const visitData = { userId, storeId, shouldShowQuestionnaire };
        if (visitDate) visitData.visitDate = new Date(visitDate);
        const visit = await Visit.create(visitData);

        user.visits += 1;
        await user.save();

        const unlockedAchievements = [];

        const achievements = await Achievement.findAll();

        for (let ach of achievements) {
            const alreadyUnlocked = await UserAchievement.findOne({
                where: { userId, achievementId: ach.id }
            });

            if (!alreadyUnlocked) {
                if (
                    (ach.type === "visits" && user.visits >= ach.condition)
                ) {
                    await UserAchievement.create({ userId, achievementId: ach.id });
                    unlockedAchievements.push(ach);
                }
            }
        }

        const completeVisit = await Visit.findByPk(visit.id, {
            include: [
                { model: User, as: 'user', attributes: ['id', 'username'] },
                { model: Store, as: 'store', attributes: ['id', 'name', 'address', 'latitude', 'longitude'] }
            ]
        });

        return res.status(201).json({
            message: 'Visit created',
            visit: completeVisit,
            unlockedAchievements,
            shouldShowQuestionnaire
        });

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
        const totalVisits = await Visit.count({
            where: { userId, storeId }
        });

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
        const routeStart = await RouteStart.findOne({
            where: { userId, routeId },
            order: [['startDate', 'DESC']]
        });

        if (!routeStart) {
            return res.status(200).json({ visitedStoreIds: [] });
        }

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

exports.getUserVisits = async (req, res) => {
    try {
        const { userId } = req.params;

        // Verify user exists
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Fetch all visits with store information
        const visits = await Visit.findAll({
            where: { userId },
            include: [
                {
                    model: Store,
                    as: 'visitStore',
                    attributes: ['id', 'name', 'address', 'latitude', 'longitude', 'cuisine', 'amenity']
                }
            ],
            order: [['visitDate', 'DESC']]
        });

        return res.status(200).json({ visits });
    } catch (error) {
        console.error('Get user visits error:', error);
        return res.status(500).json({ message: 'Server error fetching visits' });
    }
};