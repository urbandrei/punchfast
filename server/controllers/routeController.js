const Route = require('../models/routes');

// Create a new route with a name and up to 5 store ids (nullable)
exports.newRoute = async (req, res) => {
    const { name, store1_id, store2_id, store3_id, store4_id, store5_id } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'Missing required field: name' });
    }

    try {
        const newRoute = await Route.create({ name, store1_id, store2_id, store3_id, store4_id, store5_id });
        return res.status(201).json({ message: 'Route created', route: newRoute });
    } catch (error) {
        console.error('Route creation error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// List all routes
exports.getRoutes = async (req, res) => {
    try {
        const routes = await Route.findAll();
        // Gather all unique store ids from all routes
        const storeIds = new Set();
        routes.forEach(r => {
            [r.store1_id, r.store2_id, r.store3_id, r.store4_id, r.store5_id].forEach(id => {
                if (id) storeIds.add(id);
            });
        });
        // Fetch all relevant stores in one query
        const stores = await Store.findAll({ where: { id: Array.from(storeIds) } });
        const storeMap = {};
        stores.forEach(s => { storeMap[s.id] = s.name; });

        // Build response with route name and store names
        const result = routes.map(r => ({
            id: r.id,
            name: r.name,
            stores: [r.store1_id, r.store2_id, r.store3_id, r.store4_id, r.store5_id]
                .filter(id => !!id)
                .map(id => ({ id, name: storeMap[id] || null }))
        }));
        return res.status(200).json({ count: result.length, routes: result });
    } catch (error) {
        console.error('Error fetching routes:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

