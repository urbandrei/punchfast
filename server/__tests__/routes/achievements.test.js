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

// Mock associations
jest.mock('../../models/associations', () => ({}));

// Now require the models (they will use the mocked sequelize)
const Achievement = require('../../models/achievement');
const UserAchievement = require('../../models/userachievement');

const app = require('../../app');
const { mockAchievement } = require('../helpers/testHelpers');

describe('Achievement Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================
  // GET /api/achievements/ - Get All Achievements
  // ===========================================
  describe('GET /api/achievements/', () => {
    it('should return all achievements', async () => {
      const achievements = [
        mockAchievement({ id: 1, name: 'First Steps', type: 'visits', condition: 1 }),
        mockAchievement({ id: 2, name: 'Regular', type: 'visits', condition: 10 }),
        mockAchievement({ id: 3, name: 'Route Starter', type: 'routes_started', condition: 1 })
      ];
      Achievement.findAll.mockResolvedValueOnce(achievements);

      const res = await request(app).get('/api/achievements/');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(3);
      expect(res.body[0]).toHaveProperty('name', 'First Steps');
    });

    it('should return empty array when no achievements exist', async () => {
      Achievement.findAll.mockResolvedValueOnce([]);

      const res = await request(app).get('/api/achievements/');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(0);
    });

    it('should return 500 on database error', async () => {
      Achievement.findAll.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app).get('/api/achievements/');

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error', 'Failed to fetch achievements');
    });
  });

  // ===========================================
  // GET /api/achievements/user/:userId - Get User Achievements
  // ===========================================
  describe('GET /api/achievements/user/:userId', () => {
    it('should return achievements for a user', async () => {
      const userAchievements = [
        {
          id: 1,
          userId: 1,
          achievementId: 1,
          unlockedAt: new Date(),
          firstShown: true,
          achievementData: mockAchievement({ id: 1, name: 'First Steps' })
        },
        {
          id: 2,
          userId: 1,
          achievementId: 2,
          unlockedAt: new Date(),
          firstShown: false,
          achievementData: mockAchievement({ id: 2, name: 'Regular' })
        }
      ];
      UserAchievement.findAll.mockResolvedValueOnce(userAchievements);

      const res = await request(app).get('/api/achievements/user/1');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('should return empty array for user with no achievements', async () => {
      UserAchievement.findAll.mockResolvedValueOnce([]);

      const res = await request(app).get('/api/achievements/user/999');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(0);
    });

    it('should return 500 on database error', async () => {
      UserAchievement.findAll.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app).get('/api/achievements/user/1');

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error', 'Failed to fetch user achievements');
    });
  });

  // ===========================================
  // GET /api/achievements/all-with-progress/:userId - Get All Achievements With Progress
  // ===========================================
  describe('GET /api/achievements/all-with-progress/:userId', () => {
    it('should return all achievements with progress for user', async () => {
      const allAchievements = [
        mockAchievement({ id: 1, name: 'First Steps', type: 'visits', condition: 1 }),
        mockAchievement({ id: 2, name: 'Regular', type: 'visits', condition: 10 })
      ];
      const userAchievements = [
        {
          achievementId: 1,
          unlockedAt: new Date('2024-01-01')
        }
      ];

      Achievement.findAll.mockResolvedValueOnce(allAchievements);
      UserAchievement.findAll.mockResolvedValueOnce(userAchievements);

      const res = await request(app).get('/api/achievements/all-with-progress/1');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('achievements');
      expect(res.body.achievements).toHaveLength(2);
      expect(res.body.achievements[0].unlocked).toBe(true);
      expect(res.body.achievements[1].unlocked).toBe(false);
    });

    it('should return all achievements as unlocked=false for new user', async () => {
      const allAchievements = [
        mockAchievement({ id: 1, name: 'First Steps' }),
        mockAchievement({ id: 2, name: 'Regular' })
      ];

      Achievement.findAll.mockResolvedValueOnce(allAchievements);
      UserAchievement.findAll.mockResolvedValueOnce([]);

      const res = await request(app).get('/api/achievements/all-with-progress/1');

      expect(res.status).toBe(200);
      expect(res.body.achievements.every(a => a.unlocked === false)).toBe(true);
    });

    it('should return empty achievements array when no achievements exist', async () => {
      Achievement.findAll.mockResolvedValueOnce([]);
      UserAchievement.findAll.mockResolvedValueOnce([]);

      const res = await request(app).get('/api/achievements/all-with-progress/1');

      expect(res.status).toBe(200);
      expect(res.body.achievements).toHaveLength(0);
    });

    it('should return 500 on database error', async () => {
      Achievement.findAll.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app).get('/api/achievements/all-with-progress/1');

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error', 'Failed to fetch achievements');
    });
  });

  // ===========================================
  // GET /api/achievements/newly-unlocked/:userId - Get Newly Unlocked Achievements
  // ===========================================
  describe('GET /api/achievements/newly-unlocked/:userId', () => {
    it('should return newly unlocked achievements', async () => {
      const newlyUnlocked = [
        {
          id: 1,
          userId: 1,
          achievementId: 1,
          unlockedAt: new Date(),
          firstShown: false,
          achievementData: {
            id: 1,
            name: 'First Steps',
            description: 'Visit your first store',
            type: 'visits'
          }
        }
      ];
      UserAchievement.findAll.mockResolvedValueOnce(newlyUnlocked);

      const res = await request(app).get('/api/achievements/newly-unlocked/1');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('achievements');
      expect(res.body.achievements).toHaveLength(1);
      expect(res.body.achievements[0]).toHaveProperty('userAchievementId', 1);
    });

    it('should return empty array when no new achievements', async () => {
      UserAchievement.findAll.mockResolvedValueOnce([]);

      const res = await request(app).get('/api/achievements/newly-unlocked/1');

      expect(res.status).toBe(200);
      expect(res.body.achievements).toHaveLength(0);
    });

    it('should return 500 on database error', async () => {
      UserAchievement.findAll.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app).get('/api/achievements/newly-unlocked/1');

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error', 'Failed to fetch newly unlocked achievements');
    });
  });

  // ===========================================
  // POST /api/achievements/award - Award Achievement
  // ===========================================
  describe('POST /api/achievements/award', () => {
    it('should award an achievement to user', async () => {
      const newAward = {
        id: 1,
        userId: 1,
        achievementId: 1,
        unlockedAt: new Date()
      };
      UserAchievement.findOne.mockResolvedValueOnce(null);
      UserAchievement.create.mockResolvedValueOnce(newAward);

      const res = await request(app)
        .post('/api/achievements/award')
        .send({ userId: 1, achievementId: 1 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', 1);
    });

    it('should return 400 if achievement already awarded', async () => {
      const existingAward = {
        id: 1,
        userId: 1,
        achievementId: 1
      };
      UserAchievement.findOne.mockResolvedValueOnce(existingAward);

      const res = await request(app)
        .post('/api/achievements/award')
        .send({ userId: 1, achievementId: 1 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Already awarded');
    });

    it('should return 500 on database error', async () => {
      UserAchievement.findOne.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app)
        .post('/api/achievements/award')
        .send({ userId: 1, achievementId: 1 });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error', 'Could not award achievement');
    });
  });

  // ===========================================
  // POST /api/achievements/mark-shown - Mark Achievement as Shown
  // ===========================================
  describe('POST /api/achievements/mark-shown', () => {
    it('should mark achievement as shown', async () => {
      const userAchievement = {
        id: 1,
        userId: 1,
        achievementId: 1,
        firstShown: false,
        save: jest.fn().mockResolvedValueOnce(true)
      };
      UserAchievement.findOne.mockResolvedValueOnce(userAchievement);

      const res = await request(app)
        .post('/api/achievements/mark-shown')
        .send({ userId: 1, achievementId: 1 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Achievement marked as shown');
      expect(res.body).toHaveProperty('success', true);
      expect(userAchievement.firstShown).toBe(true);
    });

    it('should return 404 if user achievement not found', async () => {
      UserAchievement.findOne.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/achievements/mark-shown')
        .send({ userId: 1, achievementId: 999 });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message', 'User achievement not found');
    });

    it('should return 500 on database error', async () => {
      UserAchievement.findOne.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app)
        .post('/api/achievements/mark-shown')
        .send({ userId: 1, achievementId: 1 });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error', 'Failed to mark achievement as shown');
    });
  });
});
