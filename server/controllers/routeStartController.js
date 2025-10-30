const { User, Route, RouteStart, Store, RouteStore } = require('../models/associations');

exports.startRoute = async (req, res) => {
    const { userId, routeId, startDate } = req.body;

    if (!userId || !routeId) {
        return res.status(400).json({ message: 'Missing required fields: userId, routeId' });
    }

    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const route = await Route.findByPk(routeId, {
            include: [{
                model: Store,
                as: 'stores',
                through: { attributes: ['order'] },
                attributes: ['id', 'name', 'address', 'latitude', 'longitude']
            }],
            order: [[{ model: Store, as: 'stores' }, RouteStore, 'order', 'ASC']]
        });

        if (!route) {
            return res.status(404).json({ message: 'Route not found' });
        }

        const routeStartData = { userId, routeId };
        if (startDate) {
            routeStartData.startDate = new Date(startDate);
        }

        const routeStart = await RouteStart.create(routeStartData);

        const result = {
            id: routeStart.id,
            userId: routeStart.userId,
            routeId: routeStart.routeId,
            startDate: routeStart.startDate,
            route: {
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
            }
        };

        return res.status(201).json({ message: 'Route started', routeStart: result });
    } catch (error) {
        console.error('Route start error:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getUserRouteStarts = async (req, res) => {
    const { userId } = req.params;

    try {
        const routeStarts = await RouteStart.findAll({
            where: { userId },
            include: [
                {
                    model: Route,
                    as: 'route',
                    attributes: ['id', 'name', 'routeType'],
                    include: [{
                        model: Store,
                        as: 'stores',
                        through: { attributes: ['order'] },
                        attributes: ['id', 'name', 'address', 'latitude', 'longitude']
                    }]
                }
            ],
            order: [
                ['startDate', 'DESC'],
                [{ model: Route, as: 'route' }, { model: Store, as: 'stores' }, RouteStore, 'order', 'ASC']
            ]
        });

        const result = routeStarts.map(rs => ({
            id: rs.id,
            userId: rs.userId,
            routeId: rs.routeId,
            startDate: rs.startDate,
            route: {
                id: rs.route.id,
                name: rs.route.name,
                routeType: rs.route.routeType,
                stores: rs.route.stores.map(store => ({
                    id: store.id,
                    name: store.name,
                    address: store.address,
                    latitude: store.latitude,
                    longitude: store.longitude,
                    order: store.RouteStore.order
                })).sort((a, b) => a.order - b.order)
            }
        }));

        return res.status(200).json({ count: result.length, routeStarts: result });
    } catch (error) {
        console.error('Error fetching user route starts:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getRouteStarts = async (req, res) => {
    const { routeId } = req.params;

    try {
        const routeStarts = await RouteStart.findAll({
            where: { routeId },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username']
                }
            ],
            order: [['startDate', 'DESC']]
        });

        return res.status(200).json({ count: routeStarts.length, routeStarts });
    } catch (error) {
        console.error('Error fetching route starts:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};