const request = require('supertest');

// Mock sequelize database before anything else
jest.mock('../../config/database', () => ({
  define: jest.fn().mockReturnValue({
    findOne: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    findOrCreate: jest.fn(),
    count: jest.fn(),
    getTableName: jest.fn().mockReturnValue('Stores'),
    belongsTo: jest.fn(),
    hasMany: jest.fn(),
    belongsToMany: jest.fn()
  }),
  authenticate: jest.fn().mockResolvedValue(true),
  sync: jest.fn().mockResolvedValue(true),
  query: jest.fn().mockResolvedValue([]),
  QueryTypes: { SELECT: 'SELECT' }
}));

// Mock associations
jest.mock('../../models/associations', () => ({}));

// Mock the searchForStores logic
jest.mock('../../logic/searchForStores', () => ({
  searchAndAddStores: jest.fn().mockResolvedValue({
    totalStoresFound: 0,
    searchResults: []
  })
}));

// Mock the AI cuisine classifier
jest.mock('../../logic/aiCuisineClassifier', () => ({
  attemptCuisineClassification: jest.fn().mockResolvedValue({})
}));

const Store = require('../../models/store');
const Business = require('../../models/business');
const sequelize = require('../../config/database');
const { searchAndAddStores } = require('../../logic/searchForStores');
const { attemptCuisineClassification } = require('../../logic/aiCuisineClassifier');
const app = require('../../app');
const {
  generateValidToken,
  generateAdminToken,
  mockUser,
  mockStore,
  mockBusiness
} = require('../helpers/testHelpers');

// Mock User for auth middleware
const User = require('../../models/user');

// Ensure Store.getTableName is mocked
Store.getTableName = jest.fn().mockReturnValue('Stores');

describe('Store Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the getTableName mock
    Store.getTableName = jest.fn().mockReturnValue('Stores');
  });

  // ===========================================
  // POST /api/stores - Create Store
  // ===========================================
  describe('POST /api/stores', () => {
    it('should create a store successfully', async () => {
      const newStore = {
        id: 1,
        name: 'Test Coffee Shop',
        address: '123 Main St',
        latitude: 40.7128,
        longitude: -74.0060,
        cuisine: null,
        status: 'pending'
      };

      attemptCuisineClassification.mockResolvedValueOnce({});
      Store.create.mockResolvedValueOnce(newStore);

      const res = await request(app)
        .post('/api/stores')
        .send({
          name: 'Test Coffee Shop',
          address: '123 Main St',
          latitude: 40.7128,
          longitude: -74.0060
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', 'Store created');
      expect(res.body).toHaveProperty('store');
      expect(res.body.store.name).toBe('Test Coffee Shop');
    });

    it('should create store with website and cuisine', async () => {
      const newStore = {
        id: 1,
        name: 'Test Restaurant',
        address: '456 Oak Ave',
        latitude: 40.7130,
        longitude: -74.0065,
        website: 'https://test.com',
        cuisine: 'italian',
        status: 'pending'
      };

      attemptCuisineClassification.mockResolvedValueOnce({ cuisine: 'italian' });
      Store.create.mockResolvedValueOnce(newStore);

      const res = await request(app)
        .post('/api/stores')
        .send({
          name: 'Test Restaurant',
          address: '456 Oak Ave',
          latitude: 40.7130,
          longitude: -74.0065,
          website: 'https://test.com',
          cuisine: 'italian'
        });

      expect(res.status).toBe(201);
      expect(res.body.store).toHaveProperty('cuisine');
    });

    it('should create store as active when admin creates', async () => {
      const adminToken = generateAdminToken();
      const adminUser = mockUser({ id: 999, isAdmin: true });
      const newStore = {
        id: 1,
        name: 'Admin Created Store',
        address: '789 Pine St',
        latitude: 40.7135,
        longitude: -74.0070,
        status: 'active'
      };

      User.findByPk.mockResolvedValueOnce(adminUser);
      attemptCuisineClassification.mockResolvedValueOnce({});
      Store.create.mockResolvedValueOnce(newStore);

      const res = await request(app)
        .post('/api/stores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin Created Store',
          address: '789 Pine St',
          latitude: 40.7135,
          longitude: -74.0070
        });

      expect(res.status).toBe(201);
    });

    it('should return 400 with missing name', async () => {
      const res = await request(app)
        .post('/api/stores')
        .send({
          address: '123 Main St',
          latitude: 40.7128,
          longitude: -74.0060
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Missing required fields: name, address, latitude, longitude');
    });

    it('should return 400 with missing address', async () => {
      const res = await request(app)
        .post('/api/stores')
        .send({
          name: 'Test Store',
          latitude: 40.7128,
          longitude: -74.0060
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Missing required fields: name, address, latitude, longitude');
    });

    it('should return 400 with missing latitude', async () => {
      const res = await request(app)
        .post('/api/stores')
        .send({
          name: 'Test Store',
          address: '123 Main St',
          longitude: -74.0060
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Missing required fields: name, address, latitude, longitude');
    });

    it('should return 400 with missing longitude', async () => {
      const res = await request(app)
        .post('/api/stores')
        .send({
          name: 'Test Store',
          address: '123 Main St',
          latitude: 40.7128
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Missing required fields: name, address, latitude, longitude');
    });

    it('should return 500 on database error', async () => {
      attemptCuisineClassification.mockResolvedValueOnce({});
      Store.create.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app)
        .post('/api/stores')
        .send({
          name: 'Test Store',
          address: '123 Main St',
          latitude: 40.7128,
          longitude: -74.0060
        });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message', 'Server error');
    });
  });

  // ===========================================
  // GET /api/stores/nearby - Get Nearby Stores
  // ===========================================
  describe('GET /api/stores/nearby', () => {
    it('should return nearby stores', async () => {
      const stores = [
        {
          id: 1,
          name: 'Coffee Shop',
          address: '123 Main St',
          latitude: 40.7128,
          longitude: -74.0060,
          cuisine: 'coffee',
          distance_km: 0.5
        },
        {
          id: 2,
          name: 'Pizza Place',
          address: '456 Oak Ave',
          latitude: 40.7130,
          longitude: -74.0065,
          cuisine: 'pizza',
          distance_km: 1.2
        }
      ];

      searchAndAddStores.mockResolvedValueOnce({
        totalStoresFound: 0,
        searchResults: []
      });
      sequelize.query.mockResolvedValueOnce(stores);

      const res = await request(app)
        .get('/api/stores/nearby')
        .query({ lat: 40.7128, lng: -74.0060 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('count', 2);
      expect(res.body).toHaveProperty('stores');
      expect(res.body).toHaveProperty('hasMore');
      expect(res.body).toHaveProperty('searchInfo');
    });

    it('should return empty array when no stores nearby', async () => {
      searchAndAddStores.mockResolvedValueOnce({
        totalStoresFound: 0,
        searchResults: []
      });
      sequelize.query.mockResolvedValueOnce([]);

      const res = await request(app)
        .get('/api/stores/nearby')
        .query({ lat: 40.7128, lng: -74.0060 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('count', 0);
      expect(res.body.stores).toHaveLength(0);
    });

    it('should return 400 with invalid latitude', async () => {
      const res = await request(app)
        .get('/api/stores/nearby')
        .query({ lat: 'invalid', lng: -74.0060 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Invalid or missing latitude/longitude');
    });

    it('should return 400 with invalid longitude', async () => {
      const res = await request(app)
        .get('/api/stores/nearby')
        .query({ lat: 40.7128, lng: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Invalid or missing latitude/longitude');
    });

    it('should return 400 with missing coordinates', async () => {
      const res = await request(app)
        .get('/api/stores/nearby');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Invalid or missing latitude/longitude');
    });

    it('should accept custom radius, limit, and offset', async () => {
      searchAndAddStores.mockResolvedValueOnce({
        totalStoresFound: 0,
        searchResults: []
      });
      sequelize.query.mockResolvedValueOnce([]);

      const res = await request(app)
        .get('/api/stores/nearby')
        .query({ lat: 40.7128, lng: -74.0060, radius: 5000, limit: 5, offset: 10 });

      expect(res.status).toBe(200);
      expect(sequelize.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          replacements: expect.objectContaining({
            radius: 5000,
            limit: 5,
            offset: 10
          })
        })
      );
    });

    it('should return 400 when search has error', async () => {
      searchAndAddStores.mockResolvedValueOnce({
        error: 'Search failed'
      });

      const res = await request(app)
        .get('/api/stores/nearby')
        .query({ lat: 40.7128, lng: -74.0060 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Search failed');
    });

    it('should return 500 on database error', async () => {
      searchAndAddStores.mockResolvedValueOnce({
        totalStoresFound: 0,
        searchResults: []
      });
      sequelize.query.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app)
        .get('/api/stores/nearby')
        .query({ lat: 40.7128, lng: -74.0060 });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message', 'Server error');
    });
  });

  // ===========================================
  // GET /api/stores/:storeId/verification - Get Store Verification Status
  // ===========================================
  describe('GET /api/stores/:storeId/verification', () => {
    it('should return verified=true when store has approved business', async () => {
      const business = mockBusiness({ id: 1, username: 'testbiz', status: 'approved' });
      Business.findOne.mockResolvedValueOnce(business);

      const res = await request(app).get('/api/stores/1/verification');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('verified', true);
      expect(res.body).toHaveProperty('business');
      expect(res.body.business).toHaveProperty('username', 'testbiz');
    });

    it('should return verified=false when store has no associated business', async () => {
      Business.findOne.mockResolvedValueOnce(null);

      const res = await request(app).get('/api/stores/1/verification');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('verified', false);
      expect(res.body.business).toBeNull();
    });

    it('should return 500 on database error', async () => {
      Business.findOne.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app).get('/api/stores/1/verification');

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message', 'Server error');
    });
  });
});
