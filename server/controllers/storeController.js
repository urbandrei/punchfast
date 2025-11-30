const Store = require('../models/store');
const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');
const { searchAndAddStores } = require('../logic/searchForStores');
const { attemptCuisineClassification } = require('../logic/aiCuisineClassifier');

exports.newStore = async (req, res) => {
    const { name, address, longitude, latitude, website, cuisine } = req.body;
    if (!name || !address || typeof latitude === 'undefined' || typeof longitude === 'undefined') {
        return res.status(400).json({ message: 'Missing required fields: name, address, latitude, longitude' });
    }

    try {
        // Prepare base store data
        const baseStoreData = {
            name,
            address,
            latitude,
            longitude,
            website: website || null,
            cuisine: cuisine || null
        };

        // Attempt AI cuisine classification (synchronous during store creation)
        const classificationMetadata = await attemptCuisineClassification(baseStoreData);

        // Merge classification results with store data
        const storeDataWithCuisine = {
            ...baseStoreData,
            ...classificationMetadata
        };

        // Create store with all metadata
        const newStore = await Store.create(storeDataWithCuisine);

        // Log AI classification outcome for monitoring
        if (classificationMetadata.cuisine_source) {
            console.log(`Store ${newStore.id}: cuisine_source=${classificationMetadata.cuisine_source}` +
                       (classificationMetadata.cuisine ? `, cuisine=${classificationMetadata.cuisine}` : '') +
                       (classificationMetadata.cuisine_confidence ? `, confidence=${classificationMetadata.cuisine_confidence}` : ''));
        }

        return res.status(201).json({
            message: 'Store created',
            store: {
                id: newStore.id,
                name: newStore.name,
                address: newStore.address,
                latitude: newStore.latitude,
                longitude: newStore.longitude,
                cuisine: newStore.cuisine,
                cuisine_source: newStore.cuisine_source,
                cuisine_confidence: newStore.cuisine_confidence
            }
        });
    } catch (error) {
        console.error('Store creation error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

exports.getNearbyStores = async (req, res) => {
    const latitude = parseFloat(req.query.lat ?? req.body?.lat);
    const longitude = parseFloat(req.query.lng ?? req.body?.lng);
    const radius = parseFloat(req.query.radius ?? req.body?.radius ?? 10000);
    const limit = parseInt(req.query.limit ?? req.body?.limit ?? 15, 10);
    const offset = parseInt(req.query.offset ?? req.body?.offset ?? 0, 10);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        return res.status(400).json({ message: 'Invalid or missing latitude/longitude' });
    }

    try {
        const searchResult = await searchAndAddStores(latitude, longitude, Math.min(radius, 100));

        if (searchResult.error) {
            return res.status(400).json({ message: searchResult.error });
        }

        const tableName = (typeof Store.getTableName === 'function') ? Store.getTableName() : 'Stores';

        const distanceExpr = `6371 * acos(LEAST(1, cos(radians(:lat)) * cos(radians("latitude")) * cos(radians("longitude") - radians(:lng)) + sin(radians(:lat)) * sin(radians("latitude"))))`;

        const sql = `
            SELECT "id", "name", "address", "latitude", "longitude", "cuisine", "amenity", "shop", ${distanceExpr} AS distance_km
            FROM "${tableName}"
            WHERE "latitude" IS NOT NULL AND "longitude" IS NOT NULL
              AND ${distanceExpr} <= :radius
            ORDER BY distance_km ASC
            LIMIT :limit
            OFFSET :offset;
        `;

        const stores = await sequelize.query(sql, {
            replacements: { lat: latitude, lng: longitude, radius, limit, offset },
            type: QueryTypes.SELECT,
        });

        return res.status(200).json({
            count: stores.length,
            stores,
            hasMore: stores.length === limit,
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

