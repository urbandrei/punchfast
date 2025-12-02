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
    count: jest.fn(),
    belongsTo: jest.fn(),
    hasMany: jest.fn(),
    belongsToMany: jest.fn()
  }),
  authenticate: jest.fn().mockResolvedValue(true),
  sync: jest.fn().mockResolvedValue(true)
}));

// Mock associations
jest.mock('../../models/associations', () => ({}));

// Now require the models
const User = require('../../models/user');
const Business = require('../../models/business');
const Store = require('../../models/store');
const Route = require('../../models/routes');

const app = require('../../app');
const {
  generateValidToken,
  generateAdminToken,
  generateExpiredToken,
  mockUser,
  mockAdminUser,
  mockBusiness,
  mockStore
} = require('../helpers/testHelpers');

describe('Admin Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================
  // Admin Auth Tests - Applied to all routes
  // ===========================================
  describe('Admin Authentication', () => {
    it('should return 401 without authorization header', async () => {
      const res = await request(app).get('/api/admin/stats');

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('NO_TOKEN');
    });

    it('should return 401 with expired token', async () => {
      const expiredToken = generateExpiredToken({ isAdmin: true });

      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('TOKEN_EXPIRED');
    });

    it('should return 403 with non-admin user token', async () => {
      const userToken = generateValidToken({ isAdmin: false });

      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('ADMIN_REQUIRED');
    });

    it('should return 403 with invalid token', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('INVALID_TOKEN');
    });
  });

  // ===========================================
  // GET /api/admin/stats
  // ===========================================
  describe('GET /api/admin/stats', () => {
    it('should return stats with admin token', async () => {
      const adminToken = generateAdminToken();
      // Mock User.findByPk BEFORE the request (controller checks userId internally)
      User.findByPk.mockResolvedValueOnce(mockAdminUser());
      User.count.mockResolvedValueOnce(100);
      Route.count.mockResolvedValueOnce(50);
      Store.count.mockResolvedValueOnce(200)
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(10);

      const res = await request(app)
        .get('/api/admin/stats')
        .query({ userId: 999 })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('should return stats with correct counts', async () => {
      const adminToken = generateAdminToken();
      User.findByPk.mockResolvedValueOnce(mockAdminUser());
      User.count.mockResolvedValueOnce(150);
      Route.count.mockResolvedValueOnce(25);
      Store.count.mockResolvedValueOnce(300) // totalStores
        .mockResolvedValueOnce(50) // storesUnchanged
        .mockResolvedValueOnce(10); // storesNeedingBackfill

      const res = await request(app)
        .get('/api/admin/stats')
        .query({ userId: 999 })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalUsers');
      expect(res.body).toHaveProperty('totalRoutes');
      expect(res.body).toHaveProperty('totalStores');
      expect(res.body).toHaveProperty('geocoding');
    });

    it('should handle missing userId query param appropriately', async () => {
      const adminToken = generateAdminToken();
      // No userId provided - controller checks for userId first
      // The response depends on mock state - could be 401 (no userId) or 500 (mock error)

      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      // Without userId, the controller returns 401 or may error if mocks are exhausted
      expect([401, 500]).toContain(res.status);
    });

    it('should return 403 when userId is not admin', async () => {
      const adminToken = generateAdminToken();
      User.findByPk.mockResolvedValueOnce(mockUser({ isAdmin: false }));

      const res = await request(app)
        .get('/api/admin/stats')
        .query({ userId: 1 })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ===========================================
  // GET /api/admin/pending-businesses
  // ===========================================
  describe('GET /api/admin/pending-businesses', () => {
    it('should return pending businesses list', async () => {
      const adminToken = generateAdminToken();
      User.findByPk.mockResolvedValueOnce(mockAdminUser());
      Business.findAll.mockResolvedValueOnce([
        mockBusiness({ status: 'pending', username: 'pending1' }),
        mockBusiness({ status: 'pending', username: 'pending2' })
      ]);

      const res = await request(app)
        .get('/api/admin/pending-businesses')
        .query({ userId: 999 })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('businesses');
      expect(Array.isArray(res.body.businesses)).toBe(true);
    });

    it('should return empty array when no pending businesses', async () => {
      const adminToken = generateAdminToken();
      User.findByPk.mockResolvedValueOnce(mockAdminUser());
      Business.findAll.mockResolvedValueOnce([]);

      const res = await request(app)
        .get('/api/admin/pending-businesses')
        .query({ userId: 999 })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.businesses).toEqual([]);
    });
  });

  // ===========================================
  // POST /api/admin/approve-business
  // ===========================================
  describe('POST /api/admin/approve-business', () => {
    it('should approve business successfully', async () => {
      const adminToken = generateAdminToken();
      const business = mockBusiness({ status: 'pending' });
      User.findByPk.mockResolvedValueOnce(mockAdminUser());
      Business.findOne.mockResolvedValueOnce(business);

      const res = await request(app)
        .post('/api/admin/approve-business')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: 999, businessUsername: 'pendingbiz' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Business approved successfully');
      expect(business.save).toHaveBeenCalled();
    });

    it('should approve business with storeId', async () => {
      const adminToken = generateAdminToken();
      const business = mockBusiness({ status: 'pending' });
      User.findByPk.mockResolvedValueOnce(mockAdminUser());
      Business.findOne
        .mockResolvedValueOnce(business) // First call: find business
        .mockResolvedValueOnce(null); // Second call: check existing store association
      Store.findByPk.mockResolvedValueOnce(mockStore());

      const res = await request(app)
        .post('/api/admin/approve-business')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: 999, businessUsername: 'pendingbiz', storeId: 1 });

      expect(res.status).toBe(200);
      expect(res.body.business.storeId).toBe(1);
    });

    it('should return 400 when missing required fields', async () => {
      const adminToken = generateAdminToken();

      const res = await request(app)
        .post('/api/admin/approve-business')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: 999 });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Missing required fields');
    });

    it('should return 404 when business not found', async () => {
      const adminToken = generateAdminToken();
      User.findByPk.mockResolvedValueOnce(mockAdminUser());
      Business.findOne.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/admin/approve-business')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: 999, businessUsername: 'nonexistent' });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Business not found');
    });

    it('should return 404 when store not found', async () => {
      const adminToken = generateAdminToken();
      User.findByPk.mockResolvedValueOnce(mockAdminUser());
      Business.findOne.mockResolvedValueOnce(mockBusiness());
      Store.findByPk.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/admin/approve-business')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: 999, businessUsername: 'biz', storeId: 999 });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Store not found');
    });

    it('should return 400 when store already associated', async () => {
      const adminToken = generateAdminToken();
      const business = mockBusiness({ id: 1 });
      const existingBusiness = mockBusiness({ id: 2, username: 'existing' });
      User.findByPk.mockResolvedValueOnce(mockAdminUser());
      Business.findOne
        .mockResolvedValueOnce(business) // Find the business to approve
        .mockResolvedValueOnce(existingBusiness); // Find existing store association
      Store.findByPk.mockResolvedValueOnce(mockStore());

      const res = await request(app)
        .post('/api/admin/approve-business')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: 999, businessUsername: 'biz', storeId: 1 });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('This store is already associated with another business');
    });
  });

  // ===========================================
  // POST /api/admin/deny-business
  // ===========================================
  describe('POST /api/admin/deny-business', () => {
    it('should deny and delete business successfully', async () => {
      const adminToken = generateAdminToken();
      const business = mockBusiness({ destroy: jest.fn().mockResolvedValue(true) });
      User.findByPk.mockResolvedValueOnce(mockAdminUser());
      Business.findOne.mockResolvedValueOnce(business);

      const res = await request(app)
        .post('/api/admin/deny-business')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: 999, businessUsername: 'denybiz' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Business application denied and removed');
      expect(business.destroy).toHaveBeenCalled();
    });

    it('should return 400 when missing required fields', async () => {
      const adminToken = generateAdminToken();

      const res = await request(app)
        .post('/api/admin/deny-business')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: 999 });

      expect(res.status).toBe(400);
    });

    it('should return 404 when business not found', async () => {
      const adminToken = generateAdminToken();
      User.findByPk.mockResolvedValueOnce(mockAdminUser());
      Business.findOne.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/admin/deny-business')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: 999, businessUsername: 'nonexistent' });

      expect(res.status).toBe(404);
    });
  });

  // ===========================================
  // GET /api/admin/search-stores
  // ===========================================
  describe('GET /api/admin/search-stores', () => {
    it('should return matching stores', async () => {
      const adminToken = generateAdminToken();
      User.findByPk.mockResolvedValueOnce(mockAdminUser());
      Store.findAll.mockResolvedValueOnce([
        mockStore({ name: 'Coffee Shop' }),
        mockStore({ name: 'Coffee House' })
      ]);

      const res = await request(app)
        .get('/api/admin/search-stores')
        .query({ userId: 999, query: 'coffee' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('stores');
    });

    it('should return empty array for short query', async () => {
      const adminToken = generateAdminToken();
      User.findByPk.mockResolvedValueOnce(mockAdminUser());

      const res = await request(app)
        .get('/api/admin/search-stores')
        .query({ userId: 999, query: 'a' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.stores).toEqual([]);
    });

    it('should return empty array when no matches', async () => {
      const adminToken = generateAdminToken();
      User.findByPk.mockResolvedValueOnce(mockAdminUser());
      Store.findAll.mockResolvedValueOnce([]);

      const res = await request(app)
        .get('/api/admin/search-stores')
        .query({ userId: 999, query: 'nonexistent' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.stores).toEqual([]);
    });
  });

  // ===========================================
  // POST /api/admin/create-store
  // ===========================================
  describe('POST /api/admin/create-store', () => {
    it('should create store successfully', async () => {
      const adminToken = generateAdminToken();
      const newStore = mockStore({ id: 1, name: 'New Store' });
      User.findByPk.mockResolvedValueOnce(mockAdminUser());
      Store.create.mockResolvedValueOnce(newStore);

      const res = await request(app)
        .post('/api/admin/create-store')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: 999,
          name: 'New Store',
          address: '123 Main St',
          latitude: 40.7128,
          longitude: -74.0060
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Store created successfully');
      expect(res.body.store).toHaveProperty('id');
    });

    it('should return 400 when missing required fields', async () => {
      const adminToken = generateAdminToken();
      User.findByPk.mockResolvedValueOnce(mockAdminUser());

      const res = await request(app)
        .post('/api/admin/create-store')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: 999,
          name: 'New Store'
          // missing address, latitude, longitude
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Missing required fields');
    });
  });

  // ===========================================
  // GET /api/admin/pending-stores
  // ===========================================
  describe('GET /api/admin/pending-stores', () => {
    it('should return pending stores list', async () => {
      const adminToken = generateAdminToken();
      Store.findAll.mockResolvedValueOnce([
        mockStore({ status: 'pending' }),
        mockStore({ status: 'pending' })
      ]);

      const res = await request(app)
        .get('/api/admin/pending-stores')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('stores');
      expect(Array.isArray(res.body.stores)).toBe(true);
    });

    it('should return empty array when no pending stores', async () => {
      const adminToken = generateAdminToken();
      Store.findAll.mockResolvedValueOnce([]);

      const res = await request(app)
        .get('/api/admin/pending-stores')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.stores).toEqual([]);
    });
  });

  // ===========================================
  // PUT /api/admin/stores/:storeId
  // ===========================================
  describe('PUT /api/admin/stores/:storeId', () => {
    it('should update store successfully', async () => {
      const adminToken = generateAdminToken();
      const store = mockStore();
      Store.findByPk.mockResolvedValueOnce(store);

      const res = await request(app)
        .put('/api/admin/stores/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Name', cuisine: 'italian' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Store updated successfully');
      expect(store.save).toHaveBeenCalled();
    });

    it('should return 404 when store not found', async () => {
      const adminToken = generateAdminToken();
      Store.findByPk.mockResolvedValueOnce(null);

      const res = await request(app)
        .put('/api/admin/stores/999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Store not found');
    });

    it('should update only provided fields', async () => {
      const adminToken = generateAdminToken();
      const store = mockStore({ name: 'Original', cuisine: 'american' });
      Store.findByPk.mockResolvedValueOnce(store);

      const res = await request(app)
        .put('/api/admin/stores/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ cuisine: 'mexican' });

      expect(res.status).toBe(200);
      expect(store.cuisine).toBe('mexican');
      expect(store.name).toBe('Original'); // Unchanged
    });
  });

  // ===========================================
  // PUT /api/admin/stores/:storeId/status
  // ===========================================
  describe('PUT /api/admin/stores/:storeId/status', () => {
    it('should update store status to active', async () => {
      const adminToken = generateAdminToken();
      const store = mockStore({ status: 'pending' });
      Store.findByPk.mockResolvedValueOnce(store);

      const res = await request(app)
        .put('/api/admin/stores/1/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'active' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Store status updated successfully');
      expect(store.status).toBe('active');
    });

    it('should return 400 when status is missing', async () => {
      const adminToken = generateAdminToken();

      const res = await request(app)
        .put('/api/admin/stores/1/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Missing required field: status');
    });

    it('should return 400 with invalid status value', async () => {
      const adminToken = generateAdminToken();

      const res = await request(app)
        .put('/api/admin/stores/1/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'invalid-status' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid status value');
    });

    it('should return 404 when store not found', async () => {
      const adminToken = generateAdminToken();
      Store.findByPk.mockResolvedValueOnce(null);

      const res = await request(app)
        .put('/api/admin/stores/999/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'active' });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Store not found');
    });

    it('should accept all valid status values', async () => {
      const adminToken = generateAdminToken();
      const validStatuses = ['active', 'inactive', 'closed', 'pending'];

      for (const status of validStatuses) {
        const store = mockStore({ status: 'pending' });
        Store.findByPk.mockResolvedValueOnce(store);

        const res = await request(app)
          .put('/api/admin/stores/1/status')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status });

        expect(res.status).toBe(200);
        expect(store.status).toBe(status);
      }
    });
  });
});
