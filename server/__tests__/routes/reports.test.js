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
    Route: createMockModel(),
    Report: createMockModel()
  };
});

const { User, Store, Route, Report } = require('../../models/associations');
const app = require('../../app');
const {
  generateValidToken,
  generateAdminToken,
  mockUser,
  mockStore,
  mockRoute,
  mockReport
} = require('../helpers/testHelpers');

describe('Report Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================
  // POST /api/reports - Create Report
  // ===========================================
  describe('POST /api/reports', () => {
    it('should create a report for store successfully', async () => {
      const store = mockStore();
      const report = mockReport({ id: 1, reportedItemType: 'store', reportedItemId: 1 });

      Store.findByPk.mockResolvedValueOnce(store);
      Report.create.mockResolvedValueOnce(report);

      const res = await request(app)
        .post('/api/reports')
        .send({
          reportedItemType: 'store',
          reportedItemId: 1,
          category: 'wrong_location',
          description: 'The location is incorrect'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', 'Report submitted successfully');
      expect(res.body).toHaveProperty('report');
    });

    it('should create a report for route successfully', async () => {
      const route = mockRoute();
      const report = mockReport({ id: 1, reportedItemType: 'route', reportedItemId: 1 });

      Route.findByPk.mockResolvedValueOnce(route);
      Report.create.mockResolvedValueOnce(report);

      const res = await request(app)
        .post('/api/reports')
        .send({
          reportedItemType: 'route',
          reportedItemId: 1,
          category: 'inappropriate_content',
          description: 'Contains inappropriate content'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', 'Report submitted successfully');
    });

    it('should create report with authenticated user', async () => {
      const token = generateValidToken({ id: 1 });
      const store = mockStore();
      const user = mockUser();
      const report = mockReport({ reporterId: 1 });

      User.findByPk.mockResolvedValueOnce(user);
      Store.findByPk.mockResolvedValueOnce(store);
      Report.create.mockResolvedValueOnce(report);

      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${token}`)
        .send({
          reportedItemType: 'store',
          reportedItemId: 1,
          category: 'closed_permanently'
        });

      expect(res.status).toBe(201);
    });

    it('should return 400 when missing required fields', async () => {
      const res = await request(app)
        .post('/api/reports')
        .send({ reportedItemType: 'store' }); // missing reportedItemId and category

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Missing required fields');
    });

    it('should return 400 for invalid reportedItemType', async () => {
      const res = await request(app)
        .post('/api/reports')
        .send({
          reportedItemType: 'invalid',
          reportedItemId: 1,
          category: 'wrong_location'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid reportedItemType');
    });

    it('should return 400 for invalid category', async () => {
      const res = await request(app)
        .post('/api/reports')
        .send({
          reportedItemType: 'store',
          reportedItemId: 1,
          category: 'invalid_category'
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Invalid category');
    });

    it('should return 404 when store not found', async () => {
      Store.findByPk.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/reports')
        .send({
          reportedItemType: 'store',
          reportedItemId: 999,
          category: 'wrong_location'
        });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message', 'Store not found');
    });

    it('should return 404 when route not found', async () => {
      Route.findByPk.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/reports')
        .send({
          reportedItemType: 'route',
          reportedItemId: 999,
          category: 'wrong_location'
        });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message', 'Route not found');
    });

    it('should return 500 on database error', async () => {
      Store.findByPk.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app)
        .post('/api/reports')
        .send({
          reportedItemType: 'store',
          reportedItemId: 1,
          category: 'wrong_location'
        });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message', 'Server error');
    });
  });

  // ===========================================
  // GET /api/reports - Get All Reports (Admin)
  // ===========================================
  describe('GET /api/reports', () => {
    it('should return all reports for admin', async () => {
      const adminToken = generateAdminToken();
      const adminUser = mockUser({ id: 999, isAdmin: true });
      const reports = [
        {
          ...mockReport({ id: 1 }),
          toJSON: () => mockReport({ id: 1 })
        },
        {
          ...mockReport({ id: 2 }),
          toJSON: () => mockReport({ id: 2 })
        }
      ];

      User.findByPk.mockResolvedValueOnce(adminUser);
      Report.findAll.mockResolvedValueOnce(reports);
      Store.findByPk.mockResolvedValue(mockStore());

      const res = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('reports');
    });

    it('should filter reports by status', async () => {
      const adminToken = generateAdminToken();
      const adminUser = mockUser({ id: 999, isAdmin: true });

      User.findByPk.mockResolvedValueOnce(adminUser);
      Report.findAll.mockResolvedValueOnce([]);

      const res = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ status: 'pending' });

      expect(res.status).toBe(200);
      expect(Report.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'pending' })
        })
      );
    });

    it('should filter reports by reportedItemType', async () => {
      const adminToken = generateAdminToken();
      const adminUser = mockUser({ id: 999, isAdmin: true });

      User.findByPk.mockResolvedValueOnce(adminUser);
      Report.findAll.mockResolvedValueOnce([]);

      const res = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ reportedItemType: 'store' });

      expect(res.status).toBe(200);
    });

    it('should return 400 for invalid status filter', async () => {
      const adminToken = generateAdminToken();
      const adminUser = mockUser({ id: 999, isAdmin: true });

      User.findByPk.mockResolvedValueOnce(adminUser);

      const res = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ status: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Invalid status filter');
    });

    it('should return 400 for invalid reportedItemType filter', async () => {
      const adminToken = generateAdminToken();
      const adminUser = mockUser({ id: 999, isAdmin: true });

      User.findByPk.mockResolvedValueOnce(adminUser);

      const res = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ reportedItemType: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Invalid reportedItemType filter');
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/reports');

      expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin user', async () => {
      const userToken = generateValidToken({ id: 1, isAdmin: false });
      const user = mockUser({ id: 1, isAdmin: false });

      User.findByPk.mockResolvedValueOnce(user);

      const res = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 500 on database error', async () => {
      const adminToken = generateAdminToken();
      const adminUser = mockUser({ id: 999, isAdmin: true });

      User.findByPk.mockResolvedValueOnce(adminUser);
      Report.findAll.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message', 'Server error');
    });
  });

  // ===========================================
  // PUT /api/reports/:reportId - Update Report Status (Admin)
  // ===========================================
  describe('PUT /api/reports/:reportId', () => {
    it('should update report status successfully', async () => {
      const adminToken = generateAdminToken();
      const adminUser = mockUser({ id: 999, isAdmin: true });
      const report = {
        ...mockReport(),
        save: jest.fn().mockResolvedValueOnce(true)
      };
      const updatedReport = mockReport({ status: 'resolved' });

      User.findByPk.mockResolvedValueOnce(adminUser);
      Report.findByPk.mockResolvedValueOnce(report);
      Report.findByPk.mockResolvedValueOnce(updatedReport);

      const res = await request(app)
        .put('/api/reports/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'resolved', adminNotes: 'Issue resolved' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Report updated successfully');
    });

    it('should return 400 when missing status', async () => {
      const adminToken = generateAdminToken();
      const adminUser = mockUser({ id: 999, isAdmin: true });

      User.findByPk.mockResolvedValueOnce(adminUser);

      const res = await request(app)
        .put('/api/reports/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ adminNotes: 'Some notes' }); // missing status

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Missing required field: status');
    });

    it('should return 400 for invalid status', async () => {
      const adminToken = generateAdminToken();
      const adminUser = mockUser({ id: 999, isAdmin: true });

      User.findByPk.mockResolvedValueOnce(adminUser);

      const res = await request(app)
        .put('/api/reports/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Invalid status');
    });

    it('should return 404 when report not found', async () => {
      const adminToken = generateAdminToken();
      const adminUser = mockUser({ id: 999, isAdmin: true });

      User.findByPk.mockResolvedValueOnce(adminUser);
      Report.findByPk.mockResolvedValueOnce(null);

      const res = await request(app)
        .put('/api/reports/999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'resolved' });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message', 'Report not found');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .put('/api/reports/1')
        .send({ status: 'resolved' });

      expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin user', async () => {
      const userToken = generateValidToken({ id: 1, isAdmin: false });
      const user = mockUser({ id: 1, isAdmin: false });

      User.findByPk.mockResolvedValueOnce(user);

      const res = await request(app)
        .put('/api/reports/1')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'resolved' });

      expect(res.status).toBe(403);
    });

    it('should return 500 on database error', async () => {
      const adminToken = generateAdminToken();
      const adminUser = mockUser({ id: 999, isAdmin: true });

      // Clear any leftover mocks and set fresh ones
      User.findByPk.mockReset();
      Report.findByPk.mockReset();

      User.findByPk.mockResolvedValueOnce(adminUser);
      Report.findByPk.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app)
        .put('/api/reports/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'resolved' });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message', 'Server error');
    });
  });
});
