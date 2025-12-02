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
    Store: mockModel,
    Visit: mockModel,
    RouteStart: mockModel,
    Achievement: mockModel,
    UserAchievement: mockModel
  };
});

const { User, Store, Visit, RouteStart, Achievement, UserAchievement } = require('../../models/associations');
const app = require('../../app');
const { mockUser, mockStore, mockVisit } = require('../helpers/testHelpers');

describe('Visit Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================
  // POST /api/visits - Create Visit
  // ===========================================
  describe('POST /api/visits', () => {
    it('should create a visit successfully', async () => {
      const user = mockUser({ visits: 0, save: jest.fn().mockResolvedValueOnce(true) });
      const store = mockStore();
      const visit = {
        id: 1,
        userId: 1,
        storeId: 1,
        visitDate: new Date(),
        shouldShowQuestionnaire: false
      };
      const completeVisit = {
        ...visit,
        user: { id: 1, username: 'testuser' },
        store: { id: 1, name: 'Test Store', address: '123 Main St' }
      };

      User.findByPk.mockResolvedValueOnce(user);
      Store.findByPk.mockResolvedValueOnce(store);
      Visit.create.mockResolvedValueOnce(visit);
      Achievement.findAll.mockResolvedValueOnce([]);
      Visit.findByPk.mockResolvedValueOnce(completeVisit);

      const res = await request(app)
        .post('/api/visits')
        .send({ userId: 1, storeId: 1 });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', 'Visit created');
      expect(res.body).toHaveProperty('visit');
    });

    it('should create a visit with custom visitDate', async () => {
      const user = mockUser({ visits: 0, save: jest.fn().mockResolvedValueOnce(true) });
      const store = mockStore();
      const visitDate = '2024-01-15T10:30:00Z';
      const visit = {
        id: 1,
        userId: 1,
        storeId: 1,
        visitDate: new Date(visitDate),
        shouldShowQuestionnaire: false
      };
      const completeVisit = {
        ...visit,
        user: { id: 1, username: 'testuser' },
        store: { id: 1, name: 'Test Store' }
      };

      User.findByPk.mockResolvedValueOnce(user);
      Store.findByPk.mockResolvedValueOnce(store);
      Visit.create.mockResolvedValueOnce(visit);
      Achievement.findAll.mockResolvedValueOnce([]);
      Visit.findByPk.mockResolvedValueOnce(completeVisit);

      const res = await request(app)
        .post('/api/visits')
        .send({ userId: 1, storeId: 1, visitDate });

      expect(res.status).toBe(201);
    });

    it('should return 400 with missing required fields', async () => {
      const res = await request(app)
        .post('/api/visits')
        .send({ userId: 1 }); // missing storeId

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Missing required fields: userId, storeId');
    });

    it('should return 404 if user not found', async () => {
      User.findByPk.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/visits')
        .send({ userId: 999, storeId: 1 });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message', 'User not found');
    });

    it('should return 404 if store not found', async () => {
      const user = mockUser();
      User.findByPk.mockResolvedValueOnce(user);
      Store.findByPk.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/visits')
        .send({ userId: 1, storeId: 999 });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message', 'Store not found');
    });

    it('should return 500 on database error', async () => {
      User.findByPk.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app)
        .post('/api/visits')
        .send({ userId: 1, storeId: 1 });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message', 'Server error');
    });
  });

  // ===========================================
  // GET /api/visits/store-stats - Get Store Visit Stats
  // ===========================================
  describe('GET /api/visits/store-stats', () => {
    it('should return store visit stats', async () => {
      Visit.count.mockResolvedValueOnce(5); // totalVisits
      Visit.count.mockResolvedValueOnce(1); // visitedToday

      const res = await request(app)
        .get('/api/visits/store-stats')
        .query({ userId: 1, storeId: 1 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalVisits', 5);
      expect(res.body).toHaveProperty('visitedToday', true);
    });

    it('should return visitedToday=false when not visited today', async () => {
      Visit.count.mockResolvedValueOnce(5); // totalVisits
      Visit.count.mockResolvedValueOnce(0); // not visitedToday

      const res = await request(app)
        .get('/api/visits/store-stats')
        .query({ userId: 1, storeId: 1 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('visitedToday', false);
    });

    it('should return 400 with missing userId', async () => {
      const res = await request(app)
        .get('/api/visits/store-stats')
        .query({ storeId: 1 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Missing required parameters: userId, storeId');
    });

    it('should return 400 with missing storeId', async () => {
      const res = await request(app)
        .get('/api/visits/store-stats')
        .query({ userId: 1 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Missing required parameters: userId, storeId');
    });

    it('should return 500 on database error', async () => {
      Visit.count.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app)
        .get('/api/visits/store-stats')
        .query({ userId: 1, storeId: 1 });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message', 'Server error');
    });
  });

  // ===========================================
  // GET /api/visits/route-progress - Get Route Visit Progress
  // ===========================================
  describe('GET /api/visits/route-progress', () => {
    it('should return route visit progress', async () => {
      const routeStart = {
        id: 1,
        userId: 1,
        routeId: 1,
        startDate: new Date('2024-01-01')
      };
      const visits = [
        { storeId: 1, visitDate: new Date('2024-01-02') },
        { storeId: 2, visitDate: new Date('2024-01-03') },
        { storeId: 1, visitDate: new Date('2024-01-04') } // duplicate storeId
      ];

      RouteStart.findOne.mockResolvedValueOnce(routeStart);
      Visit.findAll.mockResolvedValueOnce(visits);

      const res = await request(app)
        .get('/api/visits/route-progress')
        .query({ userId: 1, routeId: 1 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('visitedStoreIds');
      expect(res.body.visitedStoreIds).toContain(1);
      expect(res.body.visitedStoreIds).toContain(2);
    });

    it('should return empty array when no route start found', async () => {
      RouteStart.findOne.mockResolvedValueOnce(null);

      const res = await request(app)
        .get('/api/visits/route-progress')
        .query({ userId: 1, routeId: 999 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('visitedStoreIds');
      expect(res.body.visitedStoreIds).toHaveLength(0);
    });

    it('should return 400 with missing userId', async () => {
      const res = await request(app)
        .get('/api/visits/route-progress')
        .query({ routeId: 1 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Missing required parameters: userId, routeId');
    });

    it('should return 400 with missing routeId', async () => {
      const res = await request(app)
        .get('/api/visits/route-progress')
        .query({ userId: 1 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Missing required parameters: userId, routeId');
    });

    it('should return 500 on database error', async () => {
      RouteStart.findOne.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app)
        .get('/api/visits/route-progress')
        .query({ userId: 1, routeId: 1 });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message', 'Server error');
    });
  });

  // ===========================================
  // GET /api/visits/:userId - Get User Visits
  // ===========================================
  describe('GET /api/visits/:userId', () => {
    it('should return user visits', async () => {
      const user = mockUser();
      const visits = [
        {
          id: 1,
          userId: 1,
          storeId: 1,
          visitDate: new Date(),
          visitStore: {
            id: 1,
            name: 'Coffee Shop',
            address: '123 Main St',
            latitude: 40.7128,
            longitude: -74.0060
          }
        },
        {
          id: 2,
          userId: 1,
          storeId: 2,
          visitDate: new Date(),
          visitStore: {
            id: 2,
            name: 'Pizza Place',
            address: '456 Oak Ave',
            latitude: 40.7130,
            longitude: -74.0065
          }
        }
      ];

      User.findByPk.mockResolvedValueOnce(user);
      Visit.findAll.mockResolvedValueOnce(visits);

      const res = await request(app).get('/api/visits/1');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('visits');
      expect(res.body.visits).toHaveLength(2);
    });

    it('should return empty array for user with no visits', async () => {
      const user = mockUser();

      User.findByPk.mockResolvedValueOnce(user);
      Visit.findAll.mockResolvedValueOnce([]);

      const res = await request(app).get('/api/visits/1');

      expect(res.status).toBe(200);
      expect(res.body.visits).toHaveLength(0);
    });

    it('should return 404 if user not found', async () => {
      User.findByPk.mockResolvedValueOnce(null);

      const res = await request(app).get('/api/visits/999');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message', 'User not found');
    });

    it('should return 500 on database error', async () => {
      User.findByPk.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app).get('/api/visits/1');

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message', 'Server error fetching visits');
    });
  });
});
