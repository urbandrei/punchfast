const { User, Store, RouteStart, Route, RouteStore, Visit, SavedStore, Business } = require('../models/associations');
const { Op } = require('sequelize');

const PROXIMITY_RANGE_METERS = 15;

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const O1 = lat1 * Math.PI / 180;
    const O2 = lat2 * Math.PI / 180;
    const rad_lat = (lat2 - lat1) * Math.PI / 180;
    const rad_lon = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(rad_lat / 2) * Math.sin(rad_lat / 2) + Math.cos(O1) * Math.cos(O2) * Math.sin(rad_lon / 2) * Math.sin(rad_lon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

exports.getNearbyEligibleStores = async (req, res) => {
    const { userId, latitude, longitude } = req.query;

    if (!userId || !latitude || !longitude) {
        return res.status(400).json({
            message: 'Missing required parameters: userId, latitude, longitude'
        });
    }

    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);

    if (isNaN(userLat) || isNaN(userLon)) {
        return res.status(400).json({ message: 'Invalid latitude or longitude' });
    }

    try {
        const savedStores = await SavedStore.findAll({
            where: { userId },
            include: [{
                model: Store,
                as: 'store',
                attributes: ['id', 'name', 'address', 'latitude', 'longitude']
            }]
        });

        const activeRouteStarts = await RouteStart.findAll({
            where: {
                userId,
                status: 'active'
            },
            include: [{
                model: Route,
                as: 'startRoute',
                include: [{
                    model: Store,
                    as: 'routeStoresList',
                    attributes: ['id', 'name', 'address', 'latitude', 'longitude']
                }]
            }]
        });

        const storeMap = new Map();

        savedStores.forEach(savedStore => {
            if (savedStore.store) {
                storeMap.set(savedStore.store.id, savedStore.store);
            }
        });

        // Add route stores
        activeRouteStarts.forEach(routeStart => {
            if (routeStart.startRoute && routeStart.startRoute.routeStoresList) {
                routeStart.startRoute.routeStoresList.forEach(store => {
                    storeMap.set(store.id, store);
                });
            }
        });

        const eligibleStores = Array.from(storeMap.values());

        const nearbyStores = eligibleStores.filter(store => {
            if (!store.latitude || !store.longitude) return false;

            const distance = calculateDistance(
                userLat,
                userLon,
                parseFloat(store.latitude),
                parseFloat(store.longitude)
            );

            return distance <= PROXIMITY_RANGE_METERS;
        });

        if (nearbyStores.length === 0) {
            return res.status(200).json({ stores: [] });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const storeIds = nearbyStores.map(s => s.id);
        const todaysVisits = await Visit.findAll({
            where: {
                userId,
                storeId: {
                    [Op.in]: storeIds
                },
                visitDate: {
                    [Op.gte]: today,
                    [Op.lt]: tomorrow
                }
            },
            attributes: ['storeId']
        });

        const visitedStoreIds = new Set(todaysVisits.map(v => v.storeId));

        const unvisitedNearbyStores = nearbyStores.filter(
            store => !visitedStoreIds.has(store.id)
        );

        // Check which stores are verified
        const storeIdsToCheck = unvisitedNearbyStores.map(s => s.id);
        const verifiedBusinesses = await Business.findAll({
            where: {
                storeId: { [Op.in]: storeIdsToCheck },
                status: 'approved'
            },
            attributes: ['storeId', 'username']
        });
        const verifiedStoreIds = new Set(verifiedBusinesses.map(b => b.storeId));

        return res.status(200).json({
            stores: unvisitedNearbyStores.map(store => ({
                id: store.id,
                name: store.name,
                address: store.address,
                latitude: store.latitude,
                longitude: store.longitude,
                isVerified: verifiedStoreIds.has(store.id)
            }))
        });

    } catch (error) {
        console.error('Error fetching nearby eligible stores:', error);
        return res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};
