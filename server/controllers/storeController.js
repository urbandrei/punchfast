const Store = require('../models/store');
const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');
const { searchAndAddStores } = require('../logic/searchForStores');

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

        const tableName = (typeof Store.getTableName === 'function') ? Store.getTableName() : 'Stores';

        const distanceExpr = `6371 * acos(LEAST(1, cos(radians(:lat)) * cos(radians("latitude")) * cos(radians("longitude") - radians(:lng)) + sin(radians(:lat)) * sin(radians("latitude"))))`;

        const sql = `
            SELECT "id", "name", "address", "latitude", "longitude", ${distanceExpr} AS distance_km
            FROM "${tableName}"
            WHERE "latitude" IS NOT NULL AND "longitude" IS NOT NULL
              AND ${distanceExpr} <= :radius
            ORDER BY distance_km ASC
            LIMIT :limit;
        `;

        const stores = await sequelize.query(sql, {
            replacements: { lat: latitude, lng: longitude, radius, limit },
            type: QueryTypes.SELECT,
        });

        return res.status(200).json({
            count: stores.length,
            stores,
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

