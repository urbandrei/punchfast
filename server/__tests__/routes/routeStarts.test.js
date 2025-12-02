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
    belongsTo: jest.fn(),
    hasMany: jest.fn(),
    belongsToMany: jest.fn()
  }),
  authenticate: jest.fn().mockResolvedValue(true),
  sync: jest.fn().mockResolvedValue(true)
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
    count: jest.fn()
  };
  return {
    User: mockModel,
    Route: mockModel,
    RouteStart: mockModel,
    Store: mockModel,
    RouteStore: mockModel,
    Achievement: mockModel,
    UserAchievement: mockModel
  };
});

const { User, Route, RouteStart, Achievement, UserAchievement } = require('../../models/associations');
const app = require('../../app');
const { mockUser, mockRoute } = require('../helpers/testHelpers');

describe('Route Start Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================
  // GET /api/route-starts/user/:userId - Get User Route Starts
  // ===========================================
  describe('GET /api/route-starts/user/:userId', () => {
    it('should return route starts for a user', async () => {
      const routeStarts = [
        {
          id: 1,
          userId: 1,
          routeId: 1,
          startDate: new Date(),
          status: 'active',
          startRoute: {
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
          }
        }
      ];
      RouteStart.findAll.mockResolvedValueOnce(routeStarts);

      const res = await request(app).get('/api/route-starts/user/1');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('count', 1);
      expect(res.body).toHaveProperty('routeStarts');
      expect(res.body.routeStarts).toHaveLength(1);
    });

    it('should return empty array for user with no route starts', async () => {
      RouteStart.findAll.mockResolvedValueOnce([]);

      const res = await request(app).get('/api/route-starts/user/999');

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(0);
      expect(res.body.routeStarts).toHaveLength(0);
    });

    it('should return 500 on database error', async () => {
      RouteStart.findAll.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app).get('/api/route-starts/user/1');

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message', 'Server error');
    });
  });

  // ===========================================
  // POST /api/route-starts/start - Start Route
  // ===========================================
  describe('POST /api/route-starts/start', () => {
    it('should start a route successfully', async () => {
      const user = mockUser({ routes_started: 0, save: jest.fn().mockResolvedValueOnce(true) });
      const route = {
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
      };
      const newRouteStart = {
        id: 1,
        userId: 1,
        routeId: 1,
        startDate: new Date(),
        status: 'active'
      };

      User.findByPk.mockResolvedValueOnce(user);
      Route.findByPk.mockResolvedValueOnce(route);
      RouteStart.findOne.mockResolvedValueOnce(null);
      RouteStart.create.mockResolvedValueOnce(newRouteStart);
      Achievement.findOne.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/route-starts/start')
        .send({ userId: 1, routeId: 1 });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', 'Route started');
      expect(res.body).toHaveProperty('routeStart');
    });

    it('should return 400 if user already in route', async () => {
      const user = mockUser();
      const route = mockRoute();
      const existingRouteStart = {
        id: 1,
        userId: 1,
        routeId: 1,
        status: 'active'
      };

      User.findByPk.mockResolvedValueOnce(user);
      Route.findByPk.mockResolvedValueOnce(route);
      RouteStart.findOne.mockResolvedValueOnce(existingRouteStart);

      const res = await request(app)
        .post('/api/route-starts/start')
        .send({ userId: 1, routeId: 1 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'You are already in this route');
    });

    it('should return 400 with missing required fields', async () => {
      const res = await request(app)
        .post('/api/route-starts/start')
        .send({ userId: 1 }); // missing routeId

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Missing required fields: userId, routeId');
    });

    it('should return 404 if user not found', async () => {
      User.findByPk.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/route-starts/start')
        .send({ userId: 999, routeId: 1 });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message', 'User not found');
    });

    it('should return 404 if route not found', async () => {
      const user = mockUser();
      User.findByPk.mockResolvedValueOnce(user);
      Route.findByPk.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/route-starts/start')
        .send({ userId: 1, routeId: 999 });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message', 'Route not found');
    });

    it('should reactivate left route instead of creating new', async () => {
      const user = mockUser({ routes_started: 0, save: jest.fn().mockResolvedValueOnce(true) });
      const route = {
        id: 1,
        name: 'Downtown Walk',
        routeType: 'walking',
        routeStoresList: []
      };
      const existingRouteStart = {
        id: 1,
        userId: 1,
        routeId: 1,
        status: 'left',
        save: jest.fn().mockResolvedValueOnce(true)
      };

      User.findByPk.mockResolvedValueOnce(user);
      Route.findByPk.mockResolvedValueOnce(route);
      RouteStart.findOne.mockResolvedValueOnce(existingRouteStart);
      Achievement.findOne.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/route-starts/start')
        .send({ userId: 1, routeId: 1 });

      expect(res.status).toBe(201);
      expect(existingRouteStart.status).toBe('active');
    });

    it('should return 500 on database error', async () => {
      User.findByPk.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app)
        .post('/api/route-starts/start')
        .send({ userId: 1, routeId: 1 });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message', 'Server error');
    });
  });

  // ===========================================
  // PUT /api/route-starts/leave - Leave Route
  // ===========================================
  describe('PUT /api/route-starts/leave', () => {
    it('should leave route successfully', async () => {
      const routeStart = {
        id: 1,
        userId: 1,
        routeId: 1,
        status: 'active',
        save: jest.fn().mockResolvedValueOnce(true)
      };
      const user = mockUser({ routes_completed: 0, save: jest.fn().mockResolvedValueOnce(true) });

      RouteStart.findOne.mockResolvedValueOnce(routeStart);
      User.findByPk.mockResolvedValueOnce(user);
      Achievement.findOne.mockResolvedValueOnce(null);

      const res = await request(app)
        .put('/api/route-starts/leave')
        .send({ userId: 1, routeId: 1 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Successfully left the route');
      expect(routeStart.status).toBe('left');
    });

    it('should return 400 with missing required fields', async () => {
      const res = await request(app)
        .put('/api/route-starts/leave')
        .send({ userId: 1 }); // missing routeId

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Missing required fields: userId, routeId');
    });

    it('should return 404 if route start not found', async () => {
      RouteStart.findOne.mockResolvedValueOnce(null);

      const res = await request(app)
        .put('/api/route-starts/leave')
        .send({ userId: 1, routeId: 999 });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message', 'Route start not found');
    });

    it('should return 400 if already left route', async () => {
      const routeStart = {
        id: 1,
        userId: 1,
        routeId: 1,
        status: 'left'
      };
      RouteStart.findOne.mockResolvedValueOnce(routeStart);

      const res = await request(app)
        .put('/api/route-starts/leave')
        .send({ userId: 1, routeId: 1 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'You have already left this route');
    });

    it('should return 500 on database error', async () => {
      RouteStart.findOne.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app)
        .put('/api/route-starts/leave')
        .send({ userId: 1, routeId: 1 });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message', 'Server error');
    });
  });
});
