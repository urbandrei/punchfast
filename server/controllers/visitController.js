const { User, Store, Visit } = require('../models/associations');

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

exports.getUserVisits = async (req, res) => {
    const { userId } = req.params;

    try {
        const visits = await Visit.findAll({
            where: { userId },
            include: [
                {
                    model: Store,
                    as: 'store',
                    attributes: ['id', 'name', 'address', 'latitude', 'longitude']
                }
            ],
            order: [['visitDate', 'DESC']]
        });

        return res.status(200).json({ count: visits.length, visits });
    } catch (error) {
        console.error('Error fetching user visits:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getStoreVisits = async (req, res) => {
    const { storeId } = req.params;

    try {
        const visits = await Visit.findAll({
            where: { storeId },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username']
                }
            ],
            order: [['visitDate', 'DESC']]
        });

        return res.status(200).json({ count: visits.length, visits });
    } catch (error) {
        console.error('Error fetching store visits:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};