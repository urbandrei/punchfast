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
    belongsTo: jest.fn(),
    hasMany: jest.fn(),
    belongsToMany: jest.fn()
  }),
  authenticate: jest.fn().mockResolvedValue(true),
  sync: jest.fn().mockResolvedValue(true)
}));

// Mock associations with all required models - EACH model needs its OWN mock functions!
jest.mock('../../models/associations', () => {
  const createMockModel = () => ({
    findOne: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn()
  });
  return {
    User: createMockModel(),
    Store: createMockModel(),
    RouteStart: createMockModel(),
    Route: createMockModel(),
    RouteStore: createMockModel(),
    Visit: createMockModel(),
    SavedStore: createMockModel(),
    Business: createMockModel()
  };
});

const { User, Store, RouteStart, Route, Visit, SavedStore, Business } = require('../../models/associations');
const app = require('../../app');
const { mockStore } = require('../helpers/testHelpers');

describe('Nearby Eligible Stores Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================
  // GET /api/nearby-eligible-stores
  // ===========================================
  describe('GET /api/nearby-eligible-stores', () => {
    it('should return nearby eligible stores from saved stores', async () => {
      // User's location
      const userLat = 40.7128;
      const userLon = -74.0060;

      // Store within 15 meters of user
      const savedStores = [
        {
          userId: 1,
          storeId: 1,
          savedStore: {
            id: 1,
            name: 'Nearby Coffee Shop',
            address: '123 Main St',
            latitude: 40.7128,  // Same as user - 0 meters away
            longitude: -74.0060
          }
        }
      ];

      SavedStore.findAll.mockResolvedValueOnce(savedStores);
      RouteStart.findAll.mockResolvedValueOnce([]);
      Visit.findAll.mockResolvedValueOnce([]);
      Business.findAll.mockResolvedValueOnce([]);

      const res = await request(app)
        .get('/api/nearby-eligible-stores')
        .query({ userId: 1, latitude: userLat, longitude: userLon });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('stores');
      expect(res.body.stores).toHaveLength(1);
      expect(res.body.stores[0]).toHaveProperty('name', 'Nearby Coffee Shop');
      expect(res.body.stores[0]).toHaveProperty('isVerified', false);
    });

    it('should return nearby eligible stores from active routes', async () => {
      const userLat = 40.7128;
      const userLon = -74.0060;

      const activeRouteStarts = [
        {
          userId: 1,
          routeId: 1,
          status: 'active',
          startRoute: {
            id: 1,
            name: 'Downtown Walk',
            routeStoresList: [
              {
                id: 2,
                name: 'Route Store',
                address: '456 Oak Ave',
                latitude: 40.7128,
                longitude: -74.0060
              }
            ]
          }
        }
      ];

      SavedStore.findAll.mockResolvedValueOnce([]);
      RouteStart.findAll.mockResolvedValueOnce(activeRouteStarts);
      Visit.findAll.mockResolvedValueOnce([]);
      Business.findAll.mockResolvedValueOnce([]);

      const res = await request(app)
        .get('/api/nearby-eligible-stores')
        .query({ userId: 1, latitude: userLat, longitude: userLon });

      expect(res.status).toBe(200);
      expect(res.body.stores).toHaveLength(1);
      expect(res.body.stores[0]).toHaveProperty('name', 'Route Store');
    });

    it('should mark verified stores correctly', async () => {
      const userLat = 40.7128;
      const userLon = -74.0060;

      const savedStores = [
        {
          userId: 1,
          storeId: 1,
          savedStore: {
            id: 1,
            name: 'Verified Store',
            address: '123 Main St',
            latitude: 40.7128,
            longitude: -74.0060
          }
        }
      ];

      const verifiedBusinesses = [
        { storeId: 1, username: 'verifiedbiz', status: 'approved' }
      ];

      SavedStore.findAll.mockResolvedValueOnce(savedStores);
      RouteStart.findAll.mockResolvedValueOnce([]);
      Visit.findAll.mockResolvedValueOnce([]);
      Business.findAll.mockResolvedValueOnce(verifiedBusinesses);

      const res = await request(app)
        .get('/api/nearby-eligible-stores')
        .query({ userId: 1, latitude: userLat, longitude: userLon });

      expect(res.status).toBe(200);
      expect(res.body.stores[0]).toHaveProperty('isVerified', true);
    });

    it('should exclude stores visited today', async () => {
      const userLat = 40.7128;
      const userLon = -74.0060;

      const savedStores = [
        {
          userId: 1,
          storeId: 1,
          savedStore: {
            id: 1,
            name: 'Already Visited Store',
            address: '123 Main St',
            latitude: 40.7128,
            longitude: -74.0060
          }
        }
      ];

      const todaysVisits = [
        { storeId: 1, userId: 1, visitDate: new Date() }
      ];

      SavedStore.findAll.mockResolvedValueOnce(savedStores);
      RouteStart.findAll.mockResolvedValueOnce([]);
      Visit.findAll.mockResolvedValueOnce(todaysVisits);
      Business.findAll.mockResolvedValueOnce([]);  // No verified businesses

      const res = await request(app)
        .get('/api/nearby-eligible-stores')
        .query({ userId: 1, latitude: userLat, longitude: userLon });

      expect(res.status).toBe(200);
      expect(res.body.stores).toHaveLength(0);
    });

    it('should return empty array when no stores are nearby', async () => {
      const userLat = 40.7128;
      const userLon = -74.0060;

      // Store that is far away (more than 15 meters)
      const savedStores = [
        {
          userId: 1,
          storeId: 1,
          savedStore: {
            id: 1,
            name: 'Far Away Store',
            address: '999 Distant Rd',
            latitude: 41.0000,  // About 32km away
            longitude: -74.0060
          }
        }
      ];

      SavedStore.findAll.mockResolvedValueOnce(savedStores);
      RouteStart.findAll.mockResolvedValueOnce([]);

      const res = await request(app)
        .get('/api/nearby-eligible-stores')
        .query({ userId: 1, latitude: userLat, longitude: userLon });

      expect(res.status).toBe(200);
      expect(res.body.stores).toHaveLength(0);
    });

    it('should return empty array when user has no saved stores or active routes', async () => {
      SavedStore.findAll.mockResolvedValueOnce([]);
      RouteStart.findAll.mockResolvedValueOnce([]);

      const res = await request(app)
        .get('/api/nearby-eligible-stores')
        .query({ userId: 1, latitude: 40.7128, longitude: -74.0060 });

      expect(res.status).toBe(200);
      expect(res.body.stores).toHaveLength(0);
    });

    it('should return 400 when missing userId', async () => {
      const res = await request(app)
        .get('/api/nearby-eligible-stores')
        .query({ latitude: 40.7128, longitude: -74.0060 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Missing required parameters: userId, latitude, longitude');
    });

    it('should return 400 when missing latitude', async () => {
      const res = await request(app)
        .get('/api/nearby-eligible-stores')
        .query({ userId: 1, longitude: -74.0060 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Missing required parameters: userId, latitude, longitude');
    });

    it('should return 400 when missing longitude', async () => {
      const res = await request(app)
        .get('/api/nearby-eligible-stores')
        .query({ userId: 1, latitude: 40.7128 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Missing required parameters: userId, latitude, longitude');
    });

    it('should return 400 with invalid latitude', async () => {
      const res = await request(app)
        .get('/api/nearby-eligible-stores')
        .query({ userId: 1, latitude: 'invalid', longitude: -74.0060 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Invalid latitude or longitude');
    });

    it('should return 400 with invalid longitude', async () => {
      const res = await request(app)
        .get('/api/nearby-eligible-stores')
        .query({ userId: 1, latitude: 40.7128, longitude: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Invalid latitude or longitude');
    });

    it('should return 500 on database error', async () => {
      SavedStore.findAll.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app)
        .get('/api/nearby-eligible-stores')
        .query({ userId: 1, latitude: 40.7128, longitude: -74.0060 });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message', 'Server error');
    });

    it('should deduplicate stores from saved and route stores', async () => {
      const userLat = 40.7128;
      const userLon = -74.0060;

      // Same store in both saved stores and active route
      const savedStores = [
        {
          userId: 1,
          storeId: 1,
          savedStore: {
            id: 1,
            name: 'Duplicate Store',
            address: '123 Main St',
            latitude: 40.7128,
            longitude: -74.0060
          }
        }
      ];

      const activeRouteStarts = [
        {
          userId: 1,
          routeId: 1,
          status: 'active',
          startRoute: {
            id: 1,
            name: 'Downtown Walk',
            routeStoresList: [
              {
                id: 1,  // Same store ID as saved store
                name: 'Duplicate Store',
                address: '123 Main St',
                latitude: 40.7128,
                longitude: -74.0060
              }
            ]
          }
        }
      ];

      SavedStore.findAll.mockResolvedValueOnce(savedStores);
      RouteStart.findAll.mockResolvedValueOnce(activeRouteStarts);
      Visit.findAll.mockResolvedValueOnce([]);
      Business.findAll.mockResolvedValueOnce([]);

      const res = await request(app)
        .get('/api/nearby-eligible-stores')
        .query({ userId: 1, latitude: userLat, longitude: userLon });

      expect(res.status).toBe(200);
      expect(res.body.stores).toHaveLength(1);  // Should only have one store, not two
    });

    it('should skip stores without coordinates', async () => {
      const userLat = 40.7128;
      const userLon = -74.0060;

      const savedStores = [
        {
          userId: 1,
          storeId: 1,
          savedStore: {
            id: 1,
            name: 'Store Without Coords',
            address: '123 Main St',
            latitude: null,
            longitude: null
          }
        },
        {
          userId: 1,
          storeId: 2,
          savedStore: {
            id: 2,
            name: 'Store With Coords',
            address: '456 Oak Ave',
            latitude: 40.7128,
            longitude: -74.0060
          }
        }
      ];

      SavedStore.findAll.mockResolvedValueOnce(savedStores);
      RouteStart.findAll.mockResolvedValueOnce([]);
      Visit.findAll.mockResolvedValueOnce([]);
      Business.findAll.mockResolvedValueOnce([]);

      const res = await request(app)
        .get('/api/nearby-eligible-stores')
        .query({ userId: 1, latitude: userLat, longitude: userLon });

      expect(res.status).toBe(200);
      expect(res.body.stores).toHaveLength(1);
      expect(res.body.stores[0]).toHaveProperty('name', 'Store With Coords');
    });
  });
});
