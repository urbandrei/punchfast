const { Route, Store, RouteStore } = require('../models/associations');
const { Op } = require('sequelize');

exports.newRoute = async (req, res) => {
    const { name, routeType, stores } = req.body;

    if (!name || !routeType) {
        return res.status(400).json({ message: 'Missing required fields: name, routeType' });
    }

    if (!stores || !Array.isArray(stores) || stores.length < 3 || stores.length > 10) {
        return res.status(400).json({ message: 'Stores must be an array with 3-10 items' });
    }

    try {
        const newRoute = await Route.create({ name, routeType });

        const routeStoreData = stores.map(({ storeId, order }) => ({
            routeId: newRoute.id,
            storeId,
            order: order || stores.indexOf({ storeId, order }) + 1
        }));

        await RouteStore.bulkCreate(routeStoreData);

        const completeRoute = await Route.findByPk(newRoute.id, {
            include: [{
                model: Store,
                as: 'routeStoresList',
                through: { attributes: ['order'] },
                attributes: ['id', 'name', 'address', 'latitude', 'longitude']
            }]
        });

        return res.status(201).json({ message: 'Route created', route: completeRoute });
    } catch (error) {
        console.error('Route creation error:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getNearbyRoutes = async (req, res) => {
    const latitude = parseFloat(req.query.lat ?? req.body?.lat);
    const longitude = parseFloat(req.query.lng ?? req.body?.lng);
    const radius = parseFloat(req.query.radius ?? req.body?.radius ?? 10000);
    const limit = parseInt(req.query.limit ?? req.body?.limit ?? 15, 10);
    const offset = parseInt(req.query.offset ?? req.body?.offset ?? 0, 10);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        return res.status(400).json({ message: 'Invalid or missing latitude/longitude' });
    }

    try {
        const sequelize = require('../config/database');
        const { QueryTypes } = require('sequelize');

        const distanceExpr = `6371 * acos(LEAST(1, cos(radians(:lat)) * cos(radians(s."latitude")) * cos(radians(s."longitude") - radians(:lng)) + sin(radians(:lat)) * sin(radians(s."latitude"))))`;

        const sql = `
            SELECT r."id" as route_id, ${distanceExpr} AS distance_km
            FROM "Routes" r
            INNER JOIN "RouteStores" rs ON r."id" = rs."routeId" AND rs."order" = 1
            INNER JOIN "Stores" s ON rs."storeId" = s."id"
            WHERE s."latitude" IS NOT NULL AND s."longitude" IS NOT NULL
              AND ${distanceExpr} <= :radius
            ORDER BY distance_km ASC
            LIMIT :limit
            OFFSET :offset;
        `;

        const nearbyRoutes = await sequelize.query(sql, {
            replacements: { lat: latitude, lng: longitude, radius, limit, offset },
            type: QueryTypes.SELECT,
        });

        if (nearbyRoutes.length === 0) {
            return res.status(200).json({ count: 0, routes: [], hasMore: false });
        }

        const routeIds = nearbyRoutes.map(r => r.route_id);

        const routes = await Route.findAll({
            where: { id: { [Op.in]: routeIds } },
            include: [{
                model: Store,
                as: 'routeStoresList',
                through: { attributes: ['order'] },
                attributes: ['id', 'name', 'address', 'latitude', 'longitude']
            }],
            order: [
                [{ model: Store, as: 'routeStoresList' }, RouteStore, 'order', 'ASC']
            ]
        });

        const routeMap = new Map(routes.map(r => [r.id, r]));
        const orderedRoutes = routeIds.map(id => routeMap.get(id)).filter(r => r);

        const result = orderedRoutes.map(route => ({
            id: route.id,
            name: route.name,
            routeType: route.routeType,
            stores: route.routeStoresList.map(store => ({
                id: store.id,
                name: store.name,
                address: store.address,
                latitude: store.latitude,
                longitude: store.longitude,
                order: store.RouteStore.order
            })).sort((a, b) => a.order - b.order)
        }));

        return res.status(200).json({
            count: result.length,
            routes: result,
            hasMore: result.length === limit
        });
    } catch (error) {
        console.error('Error fetching nearby routes:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};