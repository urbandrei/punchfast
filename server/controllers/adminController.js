const User = require('../models/user');
const Route = require('../models/routes');
const Store = require('../models/store');
const Business = require('../models/business');
const { Op } = require('sequelize');

/**
 * GET /api/admin/stats
 * Returns dashboard statistics for admin panel
 */
exports.getAdminStats = async (req, res) => {
  try {
    const userId = req.query.userId || req.body.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findByPk(userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    // Count totals
    const totalUsers = await User.count();
    const totalRoutes = await Route.count();
    const totalStores = await Store.count();

    // Geocoding Metric 1: Stores with enrichment_status='unchanged'
    const storesUnchanged = await Store.count({
      where: { enrichment_status: 'unchanged' }
    });

    // Geocoding Metric 2: Stores needing backfill
    // (have coords but missing state OR country codes)
    const storesNeedingBackfill = await Store.count({
      where: {
        latitude: { [Op.ne]: null },
        longitude: { [Op.ne]: null },
        enrichment_status: {
          [Op.in]: ['reverse_geocoded', 'address_completed', 'geocoded']
        },
        [Op.or]: [
          { addr_state: null },
          { addr_country: null }
        ]
      }
    });

    return res.json({
      totalUsers,
      totalRoutes,
      totalStores,
      geocoding: {
        unchanged: storesUnchanged,
        needingBackfill: storesNeedingBackfill
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/admin/pending-businesses
 * Returns list of business applications pending approval
 */
exports.getPendingBusinesses = async (req, res) => {
  try {
    const userId = req.query.userId || req.body.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findByPk(userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    const pendingBusinesses = await Business.findAll({
      where: { status: 'pending' },
      attributes: ['id', 'username', 'created_at'],
      order: [['created_at', 'DESC']]
    });

    return res.json({ businesses: pendingBusinesses });
  } catch (error) {
    console.error('Get pending businesses error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/admin/approve-business
 * Approve a business application
 */
exports.adminApproveBusiness = async (req, res) => {
  try {
    const { userId, businessUsername, storeId } = req.body || {};

    if (!userId || !businessUsername) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Verify admin
    const user = await User.findByPk(userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    // Find business
    const business = await Business.findOne({
      where: { username: businessUsername.toLowerCase().trim() }
    });

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Validate one-to-one constraint if storeId provided
    if (storeId) {
      const store = await Store.findByPk(storeId);
      if (!store) {
        return res.status(404).json({ message: 'Store not found' });
      }

      const existingBusiness = await Business.findOne({
        where: { storeId }
      });

      if (existingBusiness && existingBusiness.id !== business.id) {
        return res.status(400).json({
          message: 'This store is already associated with another business',
          existingBusiness: existingBusiness.username
        });
      }
    }

    business.status = 'approved';
    business.storeId = storeId || null;
    await business.save();

    return res.json({
      message: 'Business approved successfully',
      business: {
        username: business.username,
        status: business.status,
        storeId: business.storeId
      }
    });
  } catch (error) {
    console.error('Admin approve business error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/admin/deny-business
 * Deny/delete a business application
 */
exports.adminDenyBusiness = async (req, res) => {
  try {
    const { userId, businessUsername } = req.body || {};

    if (!userId || !businessUsername) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Verify admin
    const user = await User.findByPk(userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    // Find and delete business
    const business = await Business.findOne({
      where: { username: businessUsername.toLowerCase().trim() }
    });

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    await business.destroy();

    return res.json({
      message: 'Business application denied and removed',
      business: { username: business.username }
    });
  } catch (error) {
    console.error('Admin deny business error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/admin/search-stores?query=...&userId=...
 * Search stores by name or address for admin store association
 */
exports.searchStores = async (req, res) => {
  try {
    const { userId, query } = req.query;

    // Verify admin
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findByPk(userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    if (!query || query.trim().length < 2) {
      return res.json({ stores: [] });
    }

    const searchTerm = `%${query.trim()}%`;

    const stores = await Store.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: searchTerm } },
          { address: { [Op.iLike]: searchTerm } },
          { addr_city: { [Op.iLike]: searchTerm } }
        ],
        status: 'active'
      },
      attributes: ['id', 'name', 'address', 'addr_city', 'addr_state', 'latitude', 'longitude'],
      limit: 10,
      order: [['name', 'ASC']]
    });

    return res.json({ stores });
  } catch (error) {
    console.error('Store search error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/admin/create-store
 * Create a new store during business approval process
 */
exports.adminCreateStore = async (req, res) => {
  try {
    const { userId, name, address, latitude, longitude } = req.body;

    // Verify admin
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findByPk(userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    if (!name || !address || !latitude || !longitude) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newStore = await Store.create({
      name,
      address,
      latitude,
      longitude,
      status: 'active'
    });

    return res.json({
      message: 'Store created successfully',
      store: {
        id: newStore.id,
        name: newStore.name,
        address: newStore.address,
        latitude: newStore.latitude,
        longitude: newStore.longitude
      }
    });
  } catch (error) {
    console.error('Admin create store error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/admin/pending-stores
 * Returns list of stores pending approval
 */
exports.getPendingStores = async (req, res) => {
  try {
    // Authentication handled by requireAdmin middleware
    // req.user is guaranteed to exist and be admin

    const pendingStores = await Store.findAll({
      where: { status: 'pending' },
      attributes: [
        'id', 'name', 'address', 'latitude', 'longitude',
        'cuisine', 'amenity', 'shop', 'website', 'phone',
        'created_at', 'updated_at'
      ],
      order: [['created_at', 'DESC']]
    });

    return res.json({ stores: pendingStores });
  } catch (error) {
    console.error('Get pending stores error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * PUT /api/admin/stores/:storeId
 * Update store details
 */
exports.updateStore = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { name, address, latitude, longitude, cuisine, website, phone } = req.body;

    // Authentication handled by requireAdmin middleware

    const store = await Store.findByPk(storeId);

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Update only provided fields
    if (name !== undefined) store.name = name;
    if (address !== undefined) store.address = address;
    if (latitude !== undefined) store.latitude = latitude;
    if (longitude !== undefined) store.longitude = longitude;
    if (cuisine !== undefined) store.cuisine = cuisine;
    if (website !== undefined) store.website = website;
    if (phone !== undefined) store.phone = phone;

    await store.save();

    return res.json({
      message: 'Store updated successfully',
      store: {
        id: store.id,
        name: store.name,
        address: store.address,
        latitude: store.latitude,
        longitude: store.longitude,
        cuisine: store.cuisine,
        website: store.website,
        phone: store.phone,
        status: store.status
      }
    });
  } catch (error) {
    console.error('Update store error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * PUT /api/admin/stores/:storeId/status
 * Update store status (approve/deny pending stores, or set inactive)
 */
exports.updateStoreStatus = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { status } = req.body;

    // Authentication handled by requireAdmin middleware

    if (!status) {
      return res.status(400).json({ message: 'Missing required field: status' });
    }

    // Validate status
    const validStatuses = ['active', 'inactive', 'closed', 'pending'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const store = await Store.findByPk(storeId);

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    store.status = status;
    await store.save();

    return res.json({
      message: 'Store status updated successfully',
      store: {
        id: store.id,
        name: store.name,
        status: store.status
      }
    });
  } catch (error) {
    console.error('Update store status error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
