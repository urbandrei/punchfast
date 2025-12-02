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
    SavedStore: mockModel
  };
});

const { User, Store, SavedStore } = require('../../models/associations');
const Achievement = require('../../models/achievement');
const UserAchievement = require('../../models/userachievement');
const app = require('../../app');
const { mockUser, mockStore } = require('../helpers/testHelpers');

describe('Saved Store Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================
  // POST /api/saved-stores/toggle - Toggle Saved Store
  // ===========================================
  describe('POST /api/saved-stores/toggle', () => {
    it('should save a store successfully', async () => {
      const user = mockUser();
      const store = mockStore();

      User.findByPk.mockResolvedValueOnce(user);
      Store.findByPk.mockResolvedValueOnce(store);
      SavedStore.findOne.mockResolvedValueOnce(null);
      SavedStore.create.mockResolvedValueOnce({ id: 1, userId: 1, storeId: 1 });
      SavedStore.count.mockResolvedValueOnce(1);
      Achievement.findAll.mockResolvedValueOnce([]);

      const res = await request(app)
        .post('/api/saved-stores/toggle')
        .send({ userId: 1, storeId: 1 });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', 'Store saved successfully');
      expect(res.body).toHaveProperty('saved', true);
    });

    it('should unsave a store successfully', async () => {
      const user = mockUser();
      const store = mockStore();
      const existingSave = {
        id: 1,
        userId: 1,
        storeId: 1,
        destroy: jest.fn().mockResolvedValueOnce(true)
      };

      User.findByPk.mockResolvedValueOnce(user);
      Store.findByPk.mockResolvedValueOnce(store);
      SavedStore.findOne.mockResolvedValueOnce(existingSave);

      const res = await request(app)
        .post('/api/saved-stores/toggle')
        .send({ userId: 1, storeId: 1 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Store unsaved successfully');
      expect(res.body).toHaveProperty('saved', false);
    });

    it('should return 400 with missing required fields', async () => {
      const res = await request(app)
        .post('/api/saved-stores/toggle')
        .send({ userId: 1 }); // missing storeId

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Missing required fields: userId, storeId');
    });

    it('should return 404 if user not found', async () => {
      User.findByPk.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/saved-stores/toggle')
        .send({ userId: 999, storeId: 1 });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message', 'User not found');
    });

    it('should return 404 if store not found', async () => {
      const user = mockUser();
      User.findByPk.mockResolvedValueOnce(user);
      Store.findByPk.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/saved-stores/toggle')
        .send({ userId: 1, storeId: 999 });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message', 'Store not found');
    });

    it('should return 500 on database error', async () => {
      User.findByPk.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app)
        .post('/api/saved-stores/toggle')
        .send({ userId: 1, storeId: 1 });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message', 'Server error');
    });
  });

  // ===========================================
  // GET /api/saved-stores/:userId - Get User Saved Stores
  // ===========================================
  describe('GET /api/saved-stores/:userId', () => {
    it('should return saved stores for user', async () => {
      const user = mockUser();
      const savedStores = [
        {
          id: 1,
          userId: 1,
          storeId: 1,
          savedStore: {
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
          savedStore: {
            id: 2,
            name: 'Pizza Place',
            address: '456 Oak Ave',
            latitude: 40.7130,
            longitude: -74.0065
          }
        }
      ];

      User.findByPk.mockResolvedValueOnce(user);
      SavedStore.findAll.mockResolvedValueOnce(savedStores);

      const res = await request(app).get('/api/saved-stores/1');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('count', 2);
      expect(res.body).toHaveProperty('stores');
      expect(res.body.stores).toHaveLength(2);
    });

    it('should return empty array for user with no saved stores', async () => {
      const user = mockUser();
      User.findByPk.mockResolvedValueOnce(user);
      SavedStore.findAll.mockResolvedValueOnce([]);

      const res = await request(app).get('/api/saved-stores/1');

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(0);
      expect(res.body.stores).toHaveLength(0);
    });

    it('should return 404 if user not found', async () => {
      User.findByPk.mockResolvedValueOnce(null);

      const res = await request(app).get('/api/saved-stores/999');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message', 'User not found');
    });

    it('should return 500 on database error', async () => {
      User.findByPk.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app).get('/api/saved-stores/1');

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message', 'Server error');
    });
  });

  // ===========================================
  // GET /api/saved-stores/check/:userId/:storeId - Check if Store is Saved
  // ===========================================
  describe('GET /api/saved-stores/check/:userId/:storeId', () => {
    it('should return saved=true when store is saved', async () => {
      const savedStore = { id: 1, userId: 1, storeId: 1 };
      SavedStore.findOne.mockResolvedValueOnce(savedStore);

      const res = await request(app).get('/api/saved-stores/check/1/1');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('saved', true);
    });

    it('should return saved=false when store is not saved', async () => {
      SavedStore.findOne.mockResolvedValueOnce(null);

      const res = await request(app).get('/api/saved-stores/check/1/999');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('saved', false);
    });

    it('should return 500 on database error', async () => {
      SavedStore.findOne.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app).get('/api/saved-stores/check/1/1');

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message', 'Server error');
    });
  });
});
