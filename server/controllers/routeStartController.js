const { User, Route, RouteStart, Store, RouteStore } = require('../models/associations');
const { Achievement, UserAchievement } = require('../models/associations');


exports.startRoute = async (req, res) => {
    const { userId, routeId, startDate } = req.body;

    if (!userId || !routeId) {
        return res.status(400).json({ message: 'Missing required fields: userId, routeId' });
    }

    try {
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const route = await Route.findByPk(routeId, {
            include: [{
                model: Store,
                as: 'stores',
                through: { attributes: ['order'] },
                attributes: ['id', 'name', 'address', 'latitude', 'longitude']
            }],
            order: [[{ model: Store, as: 'stores' }, RouteStore, 'order', 'ASC']]
        });

        if (!route) return res.status(404).json({ message: 'Route not found' });

        const existingRouteStart = await RouteStart.findOne({ where: { userId, routeId } });

        let routeStart;

        if (existingRouteStart) {
            if (existingRouteStart.status === 'active') {
                return res.status(400).json({ message: 'You are already in this route' });
            }

            existingRouteStart.status = 'active';
            existingRouteStart.startDate = startDate ? new Date(startDate) : new Date();
            await existingRouteStart.save();
            routeStart = existingRouteStart;
        } else {
            const routeStartData = { userId, routeId };
            if (startDate) routeStartData.startDate = new Date(startDate);
            routeStart = await RouteStart.create(routeStartData);
        }

        user.routes_started += 1;
        await user.save();

        const unlocked = [];

        const travelerAchievement = await Achievement.findOne({
            where: { type: 'routes_started', condition: 1 }
        });

        const already = await UserAchievement.findOne({
            where: { userId, achievementId: travelerAchievement.id }
        });

        if (!already && user.routes_started >= 1) {
            await UserAchievement.create({
                userId,
                achievementId: travelerAchievement.id
            });
            unlocked.push(travelerAchievement);
        }

        const result = {
            id: routeStart.id,
            userId: routeStart.userId,
            routeId: routeStart.routeId,
            startDate: routeStart.startDate,
            status: routeStart.status,
            route: {
                id: route.id,
                name: route.name,
                routeType: route.routeType,
                stores: route.stores
                    .map(s => ({
                        id: s.id,
                        name: s.name,
                        address: s.address,
                        latitude: s.latitude,
                        longitude: s.longitude,
                        order: s.RouteStore.order
                    }))
                    .sort((a, b) => a.order - b.order)
            }
        };

        return res.status(201).json({
            message: 'Route started',
            routeStart: result,
            unlockedAchievements: unlocked          
        });

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
                    as: 'startRoute',
                    attributes: ['id', 'name', 'routeType'],
                    include: 
                    [
                        {
                            model: Store,
                            as: 'routeStoresList',
                            through: { attributes: ['order'] },
                            attributes: ['id', 'name', 'address', 'latitude', 'longitude']
                        }
                    ]
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
            status: rs.status,
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

exports.leaveRoute = async (req, res) => {
    const { userId, routeId } = req.body;

    if (!userId || !routeId) {
        return res.status(400).json({ message: 'Missing required fields: userId, routeId' });
    }

    try {
        const routeStart = await RouteStart.findOne({ where: { userId, routeId } });

        if (!routeStart) {
            return res.status(404).json({ message: 'Route start not found' });
        }

        if (routeStart.status === 'left') {
            return res.status(400).json({ message: 'You have already left this route' });
        }

        routeStart.status = 'left';
        await routeStart.save();
        
        const user = await User.findByPk(userId);
        user.routes_completed += 1;
        await user.save();

        const unlocked = [];

        const rmAchievement = await Achievement.findOne({
            where: { type: 'routes_completed', condition: 5 }
        });

        const already = await UserAchievement.findOne({
            where: { userId, achievementId: rmAchievement.id }
        });

        if (!already && user.routes_completed >= 5) {
            await UserAchievement.create({
                userId,
                achievementId: rmAchievement.id
            });
            unlocked.push(rmAchievement);
        }

        return res.status(200).json({
            message: 'Successfully left the route',
            routeStart,
            unlockedAchievements: unlocked     
        });

    } catch (error) {
        console.error('Error leaving route:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};
