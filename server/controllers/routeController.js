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
                as: 'stores',
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

exports.getRoutes = async (req, res) => {
    try {
        const routes = await Route.findAll({
            include: [{
                model: Store,
                as: 'stores',
                through: {
                    attributes: ['order'],
                    as: 'routeStoreInfo'
                },
                attributes: ['id', 'name', 'address', 'latitude', 'longitude']
            }],
            order: [
                ['id', 'ASC'],
                [{ model: Store, as: 'stores' }, RouteStore, 'order', 'ASC']
            ]
        });

        const result = routes.map(route => ({
            id: route.id,
            name: route.name,
            routeType: route.routeType,
            stores: route.stores.map(store => ({
                id: store.id,
                name: store.name,
                address: store.address,
                latitude: store.latitude,
                longitude: store.longitude,
                order: store.RouteStore.order
            })).sort((a, b) => a.order - b.order)
        }));

        return res.status(200).json({ count: result.length, routes: result });
    } catch (error) {
        console.error('Error fetching routes:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getNearbyRoutes = async (req, res) => {
    const latitude = parseFloat(req.query.lat ?? req.body.lat);
    const longitude = parseFloat(req.query.lng ?? req.body.lng);
    const radius = parseFloat(req.query.radius ?? req.body.radius ?? 5);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        return res.status(400).json({ message: 'Invalid or missing latitude/longitude' });
    }

    try {
        const sequelize = require('../config/database');
        const { QueryTypes } = require('sequelize');

        const tableName = (typeof Store.getTableName === 'function') ? Store.getTableName() : 'Stores';
        const distanceExpr = `6371 * acos(LEAST(1, cos(radians(:lat)) * cos(radians("latitude")) * cos(radians("longitude") - radians(:lng)) + sin(radians(:lat)) * sin(radians("latitude"))))`;

        const sql = `
            SELECT "id"
            FROM "${tableName}"
            WHERE "latitude" IS NOT NULL AND "longitude" IS NOT NULL
              AND ${distanceExpr} <= :radius;
        `;

        const nearbyStores = await sequelize.query(sql, {
            replacements: { lat: latitude, lng: longitude, radius },
            type: QueryTypes.SELECT,
        });

        const nearbyStoreIds = nearbyStores.map(s => s.id);

        if (nearbyStoreIds.length === 0) {
            return res.status(200).json({ count: 0, routes: [] });
        }

        const routeStores = await RouteStore.findAll({
            where: { storeId: { [Op.in]: nearbyStoreIds } },
            attributes: ['routeId'],
            group: ['routeId']
        });

        const routeIds = [...new Set(routeStores.map(rs => rs.routeId))];

        if (routeIds.length === 0) {
            return res.status(200).json({ count: 0, routes: [] });
        }

        const routes = await Route.findAll({
            where: { id: { [Op.in]: routeIds } },
            include: [{
                model: Store,
                as: 'stores',
                through: { attributes: ['order'] },
                attributes: ['id', 'name', 'address', 'latitude', 'longitude']
            }],
            order: [
                ['id', 'ASC'],
                [{ model: Store, as: 'stores' }, RouteStore, 'order', 'ASC']
            ]
        });

        const result = routes.map(route => ({
            id: route.id,
            name: route.name,
            routeType: route.routeType,
            stores: route.stores.map(store => ({
                id: store.id,
                name: store.name,
                address: store.address,
                latitude: store.latitude,
                longitude: store.longitude,
                order: store.RouteStore.order
            })).sort((a, b) => a.order - b.order)
        }));

        return res.status(200).json({ count: result.length, routes: result });
    } catch (error) {
        console.error('Error fetching nearby routes:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getRouteById = async (req, res) => {
    const { id } = req.params;

    try {
        const route = await Route.findByPk(id, {
            include: [{
                model: Store,
                as: 'stores',
                through: { attributes: ['order'] },
                attributes: ['id', 'name', 'address', 'latitude', 'longitude']
            }],
            order: [
                [{ model: Store, as: 'stores' }, RouteStore, 'order', 'ASC']
            ]
        });

        if (!route) {
            return res.status(404).json({ message: 'Route not found' });
        }

        const result = {
            id: route.id,
            name: route.name,
            routeType: route.routeType,
            stores: route.stores.map(store => ({
                id: store.id,
                name: store.name,
                address: store.address,
                latitude: store.latitude,
                longitude: store.longitude,
                order: store.RouteStore.order
            })).sort((a, b) => a.order - b.order)
        };

        return res.status(200).json({ route: result });
    } catch (error) {
        console.error('Error fetching route:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};
