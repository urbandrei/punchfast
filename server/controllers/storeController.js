const Store = require('../models/store');
const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');
const { searchAndAddStores } = require('../logic/searchForStores');
const { calculateDistance } = require('../utils/haversine');

exports.newStore = async (req, res) => {
    const { name, address, longitude, latitude } = req.body;
    if (!name || !address || typeof latitude === 'undefined' || typeof longitude === 'undefined') {
        return res.status(400).json({ message: 'Missing required fields: name, address, latitude, longitude' });
    }

    try {
        const newStore = await Store.create({ name, address, latitude, longitude });
        return res.status(201).json({ message: 'Store created', store: { id: newStore.id, name: newStore.name, address: newStore.address, latitude: newStore.latitude, longitude: newStore.longitude } });
    } catch (error) {
        console.error('Store creation error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

exports.getNearbyStores = async (req, res) => {
    const latitude = parseFloat(req.query.lat ?? req.body.lat);
    const longitude = parseFloat(req.query.lng ?? req.body.lng);
    const radius = parseFloat(req.query.radius ?? req.body.radius ?? 5);
    const limit = parseInt(req.query.limit ?? req.body.limit ?? 50, 10);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        return res.status(400).json({ message: 'Invalid or missing latitude/longitude' });
    }

    try {
        const searchResult = await searchAndAddStores(latitude, longitude, radius);

        if (searchResult.error) {
            return res.status(400).json({ message: searchResult.error });
        }

        // Fetch all stores with coordinates
        const allStores = await Store.findAll({
            where: {
                latitude: { [sequelize.Sequelize.Op.ne]: null },
                longitude: { [sequelize.Sequelize.Op.ne]: null }
            },
            attributes: ['id', 'name', 'address', 'latitude', 'longitude']
        });

        // Calculate distance for each store and filter by radius
        const storesWithDistance = allStores
            .map(store => {
                const distance_km = calculateDistance(
                    latitude,
                    longitude,
                    parseFloat(store.latitude),
                    parseFloat(store.longitude),
                    'km'
                );
                return {
                    id: store.id,
                    name: store.name,
                    address: store.address,
                    latitude: store.latitude,
                    longitude: store.longitude,
                    distance_km
                };
            })
            .filter(store => store.distance_km <= radius)
            .sort((a, b) => a.distance_km - b.distance_km)
            .slice(0, limit);

        return res.status(200).json({
            count: storesWithDistance.length,
            stores: storesWithDistance,
            searchInfo: {
                newStoresAdded: searchResult.totalStoresFound,
                areasSearched: searchResult.searchResults.length
            }
        });
    } catch (error) {
        console.error('Error fetching nearby stores:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

