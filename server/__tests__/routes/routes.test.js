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
    bulkCreate: jest.fn(),
    belongsTo: jest.fn(),
    hasMany: jest.fn(),
    belongsToMany: jest.fn()
  }),
  authenticate: jest.fn().mockResolvedValue(true),
  sync: jest.fn().mockResolvedValue(true),
  query: jest.fn().mockResolvedValue([]),
  QueryTypes: { SELECT: 'SELECT' }
}));

// Mock associations with all required models
jest.mock('../../models/associations', () => {
  const mockModel = {
    findOne: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
    bulkCreate: jest.fn()
  };
  return {
    Route: mockModel,
    Store: mockModel,
    RouteStore: mockModel
  };
});

const { Route, Store, RouteStore } = require('../../models/associations');
const sequelize = require('../../config/database');
const app = require('../../app');
const { mockRoute, mockStore } = require('../helpers/testHelpers');

describe('Route Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================
  // POST /api/routes - Create Route
  // ===========================================
  describe('POST /api/routes', () => {
    it('should create a route successfully', async () => {
      const stores = [
        { storeId: 1, order: 1 },
        { storeId: 2, order: 2 },
        { storeId: 3, order: 3 }
      ];
      const newRoute = mockRoute({ id: 1, name: 'Test Route', routeType: 'walking' });
      const completeRoute = {
        ...newRoute,
        routeStoresList: stores.map((s, i) => ({
          id: s.storeId,
          name: `Store ${s.storeId}`,
          address: `${s.storeId}23 Main St`,
          latitude: 40.7128 + (i * 0.001),
          longitude: -74.0060 + (i * 0.001),
          RouteStore: { order: s.order }
        }))
      };

      Route.create.mockResolvedValueOnce(newRoute);
      RouteStore.bulkCreate.mockResolvedValueOnce(stores);
      Route.findByPk.mockResolvedValueOnce(completeRoute);

      const res = await request(app)
        .post('/api/routes')
        .send({
          name: 'Test Route',
          routeType: 'walking',
          stores
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', 'Route created');
      expect(res.body).toHaveProperty('route');
    });

    it('should return 400 with missing required fields', async () => {
      const res = await request(app)
        .post('/api/routes')
        .send({ name: 'Test Route' }); // missing routeType

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Missing required fields: name, routeType');
    });

    it('should return 400 when stores is not an array', async () => {
      const res = await request(app)
        .post('/api/routes')
        .send({
          name: 'Test Route',
          routeType: 'walking',
          stores: 'not an array'
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Stores must be an array with 3-10 items');
    });

    it('should return 400 when stores has less than 3 items', async () => {
      const res = await request(app)
        .post('/api/routes')
        .send({
          name: 'Test Route',
          routeType: 'walking',
          stores: [{ storeId: 1, order: 1 }, { storeId: 2, order: 2 }]
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Stores must be an array with 3-10 items');
    });

    it('should return 400 when stores has more than 10 items', async () => {
      const stores = Array.from({ length: 11 }, (_, i) => ({ storeId: i + 1, order: i + 1 }));

      const res = await request(app)
        .post('/api/routes')
        .send({
          name: 'Test Route',
          routeType: 'walking',
          stores
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Stores must be an array with 3-10 items');
    });

    it('should return 400 when stores is undefined', async () => {
      const res = await request(app)
        .post('/api/routes')
        .send({
          name: 'Test Route',
          routeType: 'walking'
          // no stores
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Stores must be an array with 3-10 items');
    });

    it('should return 500 on database error', async () => {
      const stores = [
        { storeId: 1, order: 1 },
        { storeId: 2, order: 2 },
        { storeId: 3, order: 3 }
      ];

      Route.create.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app)
        .post('/api/routes')
        .send({
          name: 'Test Route',
          routeType: 'walking',
          stores
        });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message', 'Server error');
    });
  });

  // ===========================================
  // GET /api/routes/nearby - Get Nearby Routes
  // ===========================================
  describe('GET /api/routes/nearby', () => {
    it('should return nearby routes', async () => {
      const nearbyRoutes = [
        { route_id: 1, distance_km: 0.5 },
        { route_id: 2, distance_km: 1.2 }
      ];
      const routes = [
        {
          id: 1,
          name: 'Downtown Walk',
          routeType: 'walking',
          routeStoresList: [
            {
              id: 1,
              name: 'Coffee Shop',
              address: '123 Main St',
              latitude: 40.7128,
              longitude: -74.0060,
              RouteStore: { order: 1 }
            }
          ]
        },
        {
          id: 2,
          name: 'Park Route',
          routeType: 'walking',
          routeStoresList: [
            {
              id: 2,
              name: 'Pizza Place',
              address: '456 Oak Ave',
              latitude: 40.7130,
              longitude: -74.0065,
              RouteStore: { order: 1 }
            }
          ]
        }
      ];

      sequelize.query.mockResolvedValueOnce(nearbyRoutes);
      Route.findAll.mockResolvedValueOnce(routes);

      const res = await request(app)
        .get('/api/routes/nearby')
        .query({ lat: 40.7128, lng: -74.0060 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('count');
      expect(res.body).toHaveProperty('routes');
      expect(res.body).toHaveProperty('hasMore');
    });

    it('should return empty array when no routes nearby', async () => {
      sequelize.query.mockResolvedValueOnce([]);

      const res = await request(app)
        .get('/api/routes/nearby')
        .query({ lat: 40.7128, lng: -74.0060 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('count', 0);
      expect(res.body.routes).toHaveLength(0);
      expect(res.body).toHaveProperty('hasMore', false);
    });

    it('should return 400 with invalid latitude', async () => {
      const res = await request(app)
        .get('/api/routes/nearby')
        .query({ lat: 'invalid', lng: -74.0060 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Invalid or missing latitude/longitude');
    });

    it('should return 400 with invalid longitude', async () => {
      const res = await request(app)
        .get('/api/routes/nearby')
        .query({ lat: 40.7128, lng: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Invalid or missing latitude/longitude');
    });

    it('should return 400 with missing coordinates', async () => {
      const res = await request(app)
        .get('/api/routes/nearby');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Invalid or missing latitude/longitude');
    });

    it('should accept custom radius and limit', async () => {
      sequelize.query.mockResolvedValueOnce([]);

      const res = await request(app)
        .get('/api/routes/nearby')
        .query({ lat: 40.7128, lng: -74.0060, radius: 5000, limit: 5 });

      expect(res.status).toBe(200);
      expect(sequelize.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          replacements: expect.objectContaining({
            radius: 5000,
            limit: 5
          })
        })
      );
    });

    it('should return 500 on database error', async () => {
      sequelize.query.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app)
        .get('/api/routes/nearby')
        .query({ lat: 40.7128, lng: -74.0060 });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message', 'Server error');
    });
  });
});
