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
  sync: jest.fn().mockResolvedValue(true),
  query: jest.fn().mockResolvedValue([]),
  QueryTypes: { SELECT: 'SELECT' },
  fn: jest.fn((fnName, ...args) => ({ fn: fnName, args })),
  col: jest.fn((colName) => ({ col: colName })),
  cast: jest.fn((value, type) => ({ cast: value, type }))
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
    FieldQuestion: createMockModel()
  };
});

// Mock the Visit model separately (imported inline in controller)
jest.mock('../../models/visit', () => ({
  findByPk: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn()
}));

const { User, Store, FieldQuestion } = require('../../models/associations');
const Visit = require('../../models/visit');
const Achievement = require('../../models/achievement');
const UserAchievement = require('../../models/userachievement');
const app = require('../../app');
const { mockUser, mockStore, mockVisit } = require('../helpers/testHelpers');

describe('Questionnaire Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================
  // GET /api/questionnaire/pending - Check Pending Questionnaire
  // ===========================================
  describe('GET /api/questionnaire/pending', () => {
    it('should return hasQuestion=true when questionnaire pending', async () => {
      const visit = {
        id: 1,
        userId: 1,
        storeId: 1,
        shouldShowQuestionnaire: true
      };
      const store = mockStore({ id: 1, name: 'Test Store' });

      Visit.findByPk.mockResolvedValueOnce(visit);
      Store.findByPk.mockResolvedValueOnce(store);
      FieldQuestion.findAll.mockResolvedValueOnce([]);

      const res = await request(app)
        .get('/api/questionnaire/pending')
        .query({ userId: 1, visitId: 1 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('hasQuestion', true);
      expect(res.body).toHaveProperty('question');
    });

    it('should return hasQuestion=false when no questionnaire needed', async () => {
      const visit = {
        id: 1,
        userId: 1,
        storeId: 1,
        shouldShowQuestionnaire: false
      };

      Visit.findByPk.mockResolvedValueOnce(visit);

      const res = await request(app)
        .get('/api/questionnaire/pending')
        .query({ userId: 1, visitId: 1 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('hasQuestion', false);
    });

    it('should return 400 when missing userId', async () => {
      const res = await request(app)
        .get('/api/questionnaire/pending')
        .query({ visitId: 1 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Missing userId or visitId');
    });

    it('should return 400 when missing visitId', async () => {
      const res = await request(app)
        .get('/api/questionnaire/pending')
        .query({ userId: 1 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Missing userId or visitId');
    });

    it('should return 404 when visit not found', async () => {
      Visit.findByPk.mockResolvedValueOnce(null);

      const res = await request(app)
        .get('/api/questionnaire/pending')
        .query({ userId: 1, visitId: 999 });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message', 'Visit not found');
    });

    it('should return 404 when store not found', async () => {
      const visit = {
        id: 1,
        userId: 1,
        storeId: 999,
        shouldShowQuestionnaire: true
      };

      Visit.findByPk.mockResolvedValueOnce(visit);
      Store.findByPk.mockResolvedValueOnce(null);

      const res = await request(app)
        .get('/api/questionnaire/pending')
        .query({ userId: 1, visitId: 1 });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message', 'Store not found');
    });

    it('should return 500 on database error', async () => {
      Visit.findByPk.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app)
        .get('/api/questionnaire/pending')
        .query({ userId: 1, visitId: 1 });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message', 'Server error');
    });
  });

  // ===========================================
  // GET /api/questionnaire/question - Get Question
  // ===========================================
  describe('GET /api/questionnaire/question', () => {
    it('should return a question for user and store', async () => {
      const store = mockStore({ id: 1, name: 'Test Store' });

      Store.findByPk.mockResolvedValueOnce(store);
      FieldQuestion.findAll.mockResolvedValueOnce([]);

      const res = await request(app)
        .get('/api/questionnaire/question')
        .query({ userId: 1, storeId: 1 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('hasQuestion', true);
      expect(res.body).toHaveProperty('question');
      expect(res.body.question.type).toBe('rating');
    });

    it('should return hasQuestion=false when all questions answered', async () => {
      const store = mockStore({ id: 1, name: 'Test Store' });
      const answeredQuestions = [
        { fieldName: 'rating' },
        { fieldName: 'cuisine' },
        { fieldName: 'amenity' },
        { fieldName: 'shop' }
      ];

      Store.findByPk.mockResolvedValueOnce(store);
      FieldQuestion.findAll.mockResolvedValueOnce(answeredQuestions);

      const res = await request(app)
        .get('/api/questionnaire/question')
        .query({ userId: 1, storeId: 1 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('hasQuestion', false);
    });

    it('should return 400 when missing userId', async () => {
      const res = await request(app)
        .get('/api/questionnaire/question')
        .query({ storeId: 1 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Missing userId or storeId');
    });

    it('should return 400 when missing storeId', async () => {
      const res = await request(app)
        .get('/api/questionnaire/question')
        .query({ userId: 1 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Missing userId or storeId');
    });

    it('should return 404 when store not found', async () => {
      Store.findByPk.mockResolvedValueOnce(null);

      const res = await request(app)
        .get('/api/questionnaire/question')
        .query({ userId: 1, storeId: 999 });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message', 'Store not found');
    });

    it('should return 500 on database error', async () => {
      Store.findByPk.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app)
        .get('/api/questionnaire/question')
        .query({ userId: 1, storeId: 1 });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message', 'Server error');
    });
  });

  // ===========================================
  // POST /api/questionnaire/answer - Submit Answer
  // ===========================================
  describe('POST /api/questionnaire/answer', () => {
    it('should submit answer successfully', async () => {
      const response = {
        id: 1,
        userId: 1,
        storeId: 1,
        fieldName: 'rating',
        suggestedValue: '5',
        skipped: false
      };
      const user = mockUser({ id: 1, questions_answered: 0, save: jest.fn().mockResolvedValueOnce(true) });

      FieldQuestion.create.mockResolvedValueOnce(response);
      User.findByPk.mockResolvedValueOnce(user);
      Achievement.findAll.mockResolvedValueOnce([]);
      // Mock for updateStoreRating function
      FieldQuestion.findOne.mockResolvedValueOnce({ avgRating: '4.5' });
      Store.update.mockResolvedValueOnce([1]);

      const res = await request(app)
        .post('/api/questionnaire/answer')
        .send({
          userId: 1,
          storeId: 1,
          fieldName: 'rating',
          suggestedValue: '5'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Answer submitted');
      expect(res.body).toHaveProperty('response');
    });

    it('should handle skipped question', async () => {
      const response = {
        id: 1,
        userId: 1,
        storeId: 1,
        fieldName: 'rating',
        suggestedValue: null,
        skipped: true
      };

      FieldQuestion.create.mockResolvedValueOnce(response);

      const res = await request(app)
        .post('/api/questionnaire/answer')
        .send({
          userId: 1,
          storeId: 1,
          fieldName: 'rating',
          skipped: true
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Question skipped');
    });

    it('should return 400 when missing required fields', async () => {
      const res = await request(app)
        .post('/api/questionnaire/answer')
        .send({ userId: 1, storeId: 1 }); // missing fieldName

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Missing required fields');
    });

    it('should return 400 for duplicate answer', async () => {
      const error = new Error('Unique constraint');
      error.name = 'SequelizeUniqueConstraintError';
      FieldQuestion.create.mockRejectedValueOnce(error);

      const res = await request(app)
        .post('/api/questionnaire/answer')
        .send({
          userId: 1,
          storeId: 1,
          fieldName: 'rating',
          suggestedValue: '5'
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Question already answered for this store');
    });

    it('should return 500 on database error', async () => {
      FieldQuestion.create.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app)
        .post('/api/questionnaire/answer')
        .send({
          userId: 1,
          storeId: 1,
          fieldName: 'rating',
          suggestedValue: '5'
        });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message', 'Server error');
    });
  });
});
