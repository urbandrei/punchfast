const { User, Store, SavedStore } = require('../models/associations');

exports.toggleSavedStore = async (req, res) => {
    const { userId, storeId } = req.body;

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

        const existingSave = await SavedStore.findOne({
            where: { userId, storeId }
        });

        if (existingSave) {
            await existingSave.destroy();
            return res.status(200).json({
                message: 'Store unsaved successfully',
                saved: false
            });
        } else {
            await SavedStore.create({ userId, storeId });
            return res.status(201).json({
                message: 'Store saved successfully',
                saved: true
            });
        }
    } catch (error) {
        console.error('Toggle saved store error:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getUserSavedStores = async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).json({ message: 'Missing required field: userId' });
    }

    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const savedStores = await SavedStore.findAll({
            where: { userId },
            include: [
                {
                    model: Store,
                    as: 'savedStore',   // <-- CORRECT ALIAS
                    attributes: ['id', 'name', 'address', 'latitude', 'longitude']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        const stores = savedStores.map(entry => entry.savedStore);

        return res.status(200).json({
            count: stores.length,
            stores
        });
    } catch (error) {
        console.error('Error fetching user saved stores:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.checkStoreSaved = async (req, res) => {
    const { userId, storeId } = req.params;

    if (!userId || !storeId) {
        return res.status(400).json({ message: 'Missing required fields: userId, storeId' });
    }

    try {
        const savedStore = await SavedStore.findOne({
            where: { userId, storeId }
        });

        return res.status(200).json({
            saved: !!savedStore
        });
    } catch (error) {
        console.error('Error checking saved store:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};
