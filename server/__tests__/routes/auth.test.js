const request = require('supertest');
const bcrypt = require('bcryptjs');

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
const User = require('../../models/user');
const Business = require('../../models/business');
const Store = require('../../models/store');
const Punchcard = require('../../models/punchcard');
const Visit = require('../../models/visit');

const app = require('../../app');
const {
  generateValidToken,
  generateAdminToken,
  generateBusinessToken,
  generateExpiredToken,
  generateValidRefreshToken,
  generateExpiredRefreshToken,
  mockUser,
  mockBusiness,
  mockStore,
  mockPunchcard
} = require('../helpers/testHelpers');

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================
  // GET /api/ - Health Check
  // ===========================================
  describe('GET /api/', () => {
    it('should return 200 for health check', async () => {
      const res = await request(app).get('/api/');
      expect(res.status).toBe(200);
    });
  });

  // ===========================================
  // POST /api/login - Customer Login
  // ===========================================
  describe('POST /api/login', () => {
    const hashedPassword = bcrypt.hashSync('password123', 10);

    it('should login successfully with valid credentials', async () => {
      const user = mockUser({ password: hashedPassword });
      User.findOne.mockResolvedValue(user);

      const res = await request(app)
        .post('/api/login')
        .send({ username: 'testuser', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Login successful!');
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user).toHaveProperty('username');
    });

    it('should return 400 with invalid password', async () => {
      const user = mockUser({ password: hashedPassword });
      User.findOne.mockResolvedValue(user);

      const res = await request(app)
        .post('/api/login')
        .send({ username: 'testuser', password: 'wrongpassword' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid credentials.');
    });

    it('should return 400 when user not found', async () => {
      User.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/login')
        .send({ username: 'nonexistent', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid credentials.');
    });

    it('should return 400 with missing username', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({ password: 'password123' });

      expect(res.status).toBe(400);
    });

    it('should return 400 with missing password', async () => {
      User.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/login')
        .send({ username: 'testuser' });

      expect(res.status).toBe(400);
    });

    it('should return 400 with empty body', async () => {
      User.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/login')
        .send({});

      expect(res.status).toBe(400);
    });

    it('should normalize username to lowercase', async () => {
      const user = mockUser({ password: hashedPassword, username: 'testuser' });
      User.findOne.mockResolvedValue(user);

      const res = await request(app)
        .post('/api/login')
        .send({ username: 'TESTUSER', password: 'password123' });

      expect(res.status).toBe(200);
      expect(User.findOne).toHaveBeenCalledWith({ where: { username: 'testuser' } });
    });

    it('should handle server errors gracefully', async () => {
      User.findOne.mockRejectedValue(new Error('Database error'));

      const res = await request(app)
        .post('/api/login')
        .send({ username: 'testuser', password: 'password123' });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Server error');
    });
  });

  // ===========================================
  // POST /api/signup - Customer Signup
  // ===========================================
  describe('POST /api/signup', () => {
    it('should signup successfully with valid data', async () => {
      User.findOne.mockResolvedValue(null); // No existing user
      const newUser = mockUser({ id: 1, username: 'newuser' });
      User.create.mockResolvedValue(newUser);

      const res = await request(app)
        .post('/api/signup')
        .send({ username: 'newuser', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Signup successful!');
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user.username).toBe('newuser');
    });

    it('should return 400 when username already exists', async () => {
      User.findOne.mockResolvedValue(mockUser());

      const res = await request(app)
        .post('/api/signup')
        .send({ username: 'existinguser', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Username already in use.');
    });

    it('should normalize username to lowercase', async () => {
      User.findOne.mockResolvedValue(null);
      const newUser = mockUser({ username: 'newuser' });
      User.create.mockResolvedValue(newUser);

      const res = await request(app)
        .post('/api/signup')
        .send({ username: 'NEWUSER', password: 'password123' });

      expect(res.status).toBe(201);
      expect(User.findOne).toHaveBeenCalledWith({ where: { username: 'newuser' } });
    });

    it('should trim whitespace from username', async () => {
      User.findOne.mockResolvedValue(null);
      const newUser = mockUser({ username: 'newuser' });
      User.create.mockResolvedValue(newUser);

      const res = await request(app)
        .post('/api/signup')
        .send({ username: '  newuser  ', password: 'password123' });

      expect(res.status).toBe(201);
      expect(User.findOne).toHaveBeenCalledWith({ where: { username: 'newuser' } });
    });

    it('should handle server errors gracefully', async () => {
      User.findOne.mockRejectedValue(new Error('Database error'));

      const res = await request(app)
        .post('/api/signup')
        .send({ username: 'newuser', password: 'password123' });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Server error');
    });
  });

  // ===========================================
  // POST /api/refresh-token - Refresh User Token
  // ===========================================
  describe('POST /api/refresh-token', () => {
    it('should return 400 when refresh token is missing', async () => {
      const res = await request(app)
        .post('/api/refresh-token')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Refresh token required');
    });

    it('should return 403 with invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/refresh-token')
        .send({ refreshToken: 'invalid-token' });

      expect(res.status).toBe(403);
    });

    it('should return 403 with expired refresh token', async () => {
      const expiredToken = generateExpiredRefreshToken();

      const res = await request(app)
        .post('/api/refresh-token')
        .send({ refreshToken: expiredToken });

      expect(res.status).toBe(403);
    });

    it('should return 404 when user not found', async () => {
      const validRefreshToken = generateValidRefreshToken({ id: 999 });
      User.findByPk.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/refresh-token')
        .send({ refreshToken: validRefreshToken });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });

    it('should return 403 when refresh token has been revoked', async () => {
      const validRefreshToken = generateValidRefreshToken();
      const user = mockUser({ refreshToken: null }); // Token revoked
      User.findByPk.mockResolvedValue(user);

      const res = await request(app)
        .post('/api/refresh-token')
        .send({ refreshToken: validRefreshToken });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Refresh token has been revoked');
    });

    it('should return 403 with wrong token type', async () => {
      const businessToken = generateValidRefreshToken({ type: 'business' });

      const res = await request(app)
        .post('/api/refresh-token')
        .send({ refreshToken: businessToken });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Invalid token type');
    });
  });

  // ===========================================
  // POST /api/logout - Customer Logout
  // ===========================================
  describe('POST /api/logout', () => {
    it('should logout successfully with valid token', async () => {
      const token = generateValidToken();
      const user = mockUser();
      User.findByPk.mockResolvedValue(user);

      const res = await request(app)
        .post('/api/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Logged out successfully');
      expect(user.update).toHaveBeenCalledWith({
        refreshToken: null,
        refreshTokenCreatedAt: null,
        refreshTokenExpiresAt: null
      });
    });

    it('should return 401 without token', async () => {
      const res = await request(app).post('/api/logout');

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('NO_TOKEN');
    });

    it('should return 401 with expired token', async () => {
      const expiredToken = generateExpiredToken();

      const res = await request(app)
        .post('/api/logout')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('TOKEN_EXPIRED');
    });

    it('should return 403 with invalid token', async () => {
      const res = await request(app)
        .post('/api/logout')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('INVALID_TOKEN');
    });

    it('should return 404 when user not found', async () => {
      const token = generateValidToken();
      User.findByPk.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });
  });

  // ===========================================
  // GET /api/session - Get Customer Session
  // ===========================================
  describe('GET /api/session', () => {
    it('should return session info with valid token', async () => {
      const token = generateValidToken();
      const user = mockUser({
        refreshTokenExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
      });
      User.findByPk.mockResolvedValue(user);

      const res = await request(app)
        .get('/api/session')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.session).toHaveProperty('userId');
      expect(res.body.session).toHaveProperty('username');
      expect(res.body.session).toHaveProperty('isAdmin');
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/session');

      expect(res.status).toBe(401);
    });

    it('should return 401 with expired token', async () => {
      const expiredToken = generateExpiredToken();

      const res = await request(app)
        .get('/api/session')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
    });

    it('should return 404 when user not found', async () => {
      const token = generateValidToken();
      User.findByPk.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/session')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  // ===========================================
  // POST /api/change-password - Change Password
  // ===========================================
  describe('POST /api/change-password', () => {
    const currentHashedPassword = bcrypt.hashSync('oldpassword', 10);

    it('should change password successfully', async () => {
      const token = generateValidToken();
      const user = mockUser({ password: currentHashedPassword });
      User.findByPk.mockResolvedValue(user);

      const res = await request(app)
        .post('/api/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'oldpassword', newPassword: 'newpassword123' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Password changed successfully!');
    });

    it('should return 400 when current password is incorrect', async () => {
      const token = generateValidToken();
      const user = mockUser({ password: currentHashedPassword });
      User.findByPk.mockResolvedValue(user);

      const res = await request(app)
        .post('/api/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'wrongpassword', newPassword: 'newpassword123' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Current password is incorrect.');
    });

    it('should return 400 when missing required fields', async () => {
      const token = generateValidToken();

      const res = await request(app)
        .post('/api/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'oldpassword' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Missing required fields.');
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .post('/api/change-password')
        .send({ currentPassword: 'oldpassword', newPassword: 'newpassword123' });

      expect(res.status).toBe(401);
    });

    it('should return 404 when user not found', async () => {
      const token = generateValidToken();
      User.findByPk.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'oldpassword', newPassword: 'newpassword123' });

      expect(res.status).toBe(404);
    });
  });

  // ===========================================
  // POST /api/business/signup - Business Signup
  // ===========================================
  describe('POST /api/business/signup', () => {
    it('should signup business successfully', async () => {
      Business.findOne.mockResolvedValue(null);
      const newBusiness = mockBusiness({ status: 'pending' });
      Business.create.mockResolvedValue(newBusiness);

      const res = await request(app)
        .post('/api/business/signup')
        .send({ username: 'newbusiness', password: 'business123' });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Application submitted. Pending approval.');
      expect(res.body.business.status).toBe('pending');
    });

    it('should return 400 when username already exists', async () => {
      Business.findOne.mockResolvedValue(mockBusiness());

      const res = await request(app)
        .post('/api/business/signup')
        .send({ username: 'existingbusiness', password: 'business123' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Username already in use.');
    });

    it('should normalize username to lowercase', async () => {
      Business.findOne.mockResolvedValue(null);
      const newBusiness = mockBusiness({ username: 'newbusiness' });
      Business.create.mockResolvedValue(newBusiness);

      const res = await request(app)
        .post('/api/business/signup')
        .send({ username: 'NEWBUSINESS', password: 'business123' });

      expect(res.status).toBe(201);
      expect(Business.findOne).toHaveBeenCalledWith({ where: { username: 'newbusiness' } });
    });
  });

  // ===========================================
  // POST /api/business/login - Business Login
  // ===========================================
  describe('POST /api/business/login', () => {
    const hashedPassword = bcrypt.hashSync('business123', 10);

    it('should login approved business successfully', async () => {
      const business = mockBusiness({ password: hashedPassword, status: 'approved' });
      Business.findOne.mockResolvedValue(business);

      const res = await request(app)
        .post('/api/business/login')
        .send({ username: 'testbusiness', password: 'business123' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Login successful!');
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('should return 403 for pending business', async () => {
      const business = mockBusiness({ password: hashedPassword, status: 'pending' });
      Business.findOne.mockResolvedValue(business);

      const res = await request(app)
        .post('/api/business/login')
        .send({ username: 'pendingbusiness', password: 'business123' });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Your application is pending approval.');
    });

    it('should return 400 with invalid credentials', async () => {
      const business = mockBusiness({ password: hashedPassword });
      Business.findOne.mockResolvedValue(business);

      const res = await request(app)
        .post('/api/business/login')
        .send({ username: 'testbusiness', password: 'wrongpassword' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid credentials.');
    });

    it('should return 400 when business not found', async () => {
      Business.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/business/login')
        .send({ username: 'nonexistent', password: 'business123' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid credentials.');
    });
  });

  // ===========================================
  // POST /api/business/refresh-token
  // ===========================================
  describe('POST /api/business/refresh-token', () => {
    it('should return 400 when refresh token is missing', async () => {
      const res = await request(app)
        .post('/api/business/refresh-token')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Refresh token required');
    });

    it('should return 403 with wrong token type', async () => {
      const userToken = generateValidRefreshToken({ type: 'user' });

      const res = await request(app)
        .post('/api/business/refresh-token')
        .send({ refreshToken: userToken });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Invalid token type');
    });

    it('should return 404 when business not found', async () => {
      const validRefreshToken = generateValidRefreshToken({ id: 999, type: 'business' });
      Business.findByPk.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/business/refresh-token')
        .send({ refreshToken: validRefreshToken });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Business not found');
    });
  });

  // ===========================================
  // POST /api/business/logout
  // ===========================================
  describe('POST /api/business/logout', () => {
    it('should logout business successfully', async () => {
      const token = generateBusinessToken();
      const business = mockBusiness();
      Business.findByPk.mockResolvedValue(business);

      const res = await request(app)
        .post('/api/business/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Logged out successfully');
    });

    it('should return 401 without token', async () => {
      const res = await request(app).post('/api/business/logout');

      expect(res.status).toBe(401);
    });

    it('should return 403 with user token instead of business token', async () => {
      const userToken = generateValidToken();

      const res = await request(app)
        .post('/api/business/logout')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('BUSINESS_AUTH_REQUIRED');
    });
  });

  // ===========================================
  // GET /api/business/session
  // ===========================================
  describe('GET /api/business/session', () => {
    it('should return business session info', async () => {
      const token = generateBusinessToken();
      const business = mockBusiness({
        refreshTokenExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
      });
      Business.findByPk.mockResolvedValue(business);

      const res = await request(app)
        .get('/api/business/session')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.session).toHaveProperty('businessId');
      expect(res.body.session).toHaveProperty('username');
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/business/session');

      expect(res.status).toBe(401);
    });

    it('should return 403 with user token', async () => {
      const userToken = generateValidToken();

      const res = await request(app)
        .get('/api/business/session')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ===========================================
  // POST /api/approve-business (Admin Token)
  // ===========================================
  describe('POST /api/approve-business', () => {
    it('should approve business with valid admin token', async () => {
      const business = mockBusiness({ status: 'pending' });
      Business.findOne.mockResolvedValue(business);

      const res = await request(app)
        .post('/api/approve-business')
        .set('x-admin-token', 'test-admin-token')
        .send({ username: 'pendingbusiness' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Approved');
      expect(business.save).toHaveBeenCalled();
    });

    it('should return 401 without admin token', async () => {
      const res = await request(app)
        .post('/api/approve-business')
        .send({ username: 'pendingbusiness' });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Unauthorized');
    });

    it('should return 401 with invalid admin token', async () => {
      const res = await request(app)
        .post('/api/approve-business')
        .set('x-admin-token', 'wrong-token')
        .send({ username: 'pendingbusiness' });

      expect(res.status).toBe(401);
    });

    it('should return 400 when username is missing', async () => {
      const res = await request(app)
        .post('/api/approve-business')
        .set('x-admin-token', 'test-admin-token')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Missing username');
    });

    it('should return 404 when business not found', async () => {
      Business.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/approve-business')
        .set('x-admin-token', 'test-admin-token')
        .send({ username: 'nonexistent' });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Business not found');
    });
  });

  // ===========================================
  // GET /api/business-offer
  // ===========================================
  describe('GET /api/business-offer', () => {
    it('should return business offer/goal', async () => {
      const business = mockBusiness({ goal: 15 });
      Business.findOne.mockResolvedValue(business);

      const res = await request(app)
        .get('/api/business-offer')
        .query({ username: 'testbusiness' });

      expect(res.status).toBe(200);
      expect(res.body.goal).toBe(15);
    });

    it('should return 404 when business not found', async () => {
      Business.findOne.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/business-offer')
        .query({ username: 'nonexistent' });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Business not found');
    });
  });

  // ===========================================
  // PUT /api/business-offer
  // ===========================================
  describe('PUT /api/business-offer', () => {
    it('should update business offer/goal', async () => {
      const business = mockBusiness({ goal: 10 });
      Business.findOne.mockResolvedValue(business);

      const res = await request(app)
        .put('/api/business-offer')
        .send({ username: 'testbusiness', goal: 20 });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Offer updated');
      expect(business.save).toHaveBeenCalled();
    });

    it('should return 404 when business not found', async () => {
      Business.findOne.mockResolvedValue(null);

      const res = await request(app)
        .put('/api/business-offer')
        .send({ username: 'nonexistent', goal: 20 });

      expect(res.status).toBe(404);
    });

    it('should enforce minimum goal of 1 for negative values', async () => {
      const business = mockBusiness({ goal: 10 });
      Business.findOne.mockResolvedValue(business);

      const res = await request(app)
        .put('/api/business-offer')
        .send({ username: 'testbusiness', goal: -5 });

      expect(res.status).toBe(200);
      // The controller sets goal to max(1, parsed value), so -5 becomes 1
      expect(res.body.goal).toBe(1);
    });
  });

  // ===========================================
  // POST /api/punch - Punchcard
  // ===========================================
  describe('POST /api/punch', () => {
    it('should return 400 when customer not found', async () => {
      User.findOne.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/punch')
        .send({ customer_username: 'nonexistent', business_username: 'business' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Customer Not Found.');
    });

    it('should return 400 when business not found', async () => {
      const user = mockUser({ username: 'customer' });
      User.findOne.mockResolvedValueOnce(user);
      Business.findOne.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/punch')
        .send({ customer_username: 'customer', business_username: 'nonexistent' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Business Not Found.');
    });

    it('should return 403 when business not approved', async () => {
      const user = mockUser({ username: 'customer' });
      User.findOne.mockResolvedValueOnce(user);
      Business.findOne.mockResolvedValueOnce(mockBusiness({ status: 'pending' }));

      const res = await request(app)
        .post('/api/punch')
        .send({ customer_username: 'customer', business_username: 'business' });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Business not approved yet.');
    });

    it('should return 400 when business has no store', async () => {
      const user = mockUser({ username: 'customer' });
      User.findOne.mockResolvedValueOnce(user);
      Business.findOne.mockResolvedValueOnce(mockBusiness({ status: 'approved', storeId: null }));

      const res = await request(app)
        .post('/api/punch')
        .send({ customer_username: 'customer', business_username: 'business' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Business must be associated with a store.');
    });

    it('should create new punchcard and record punch', async () => {
      const user = mockUser({ username: 'customer' });
      const business = mockBusiness({ username: 'business', status: 'approved', storeId: 1, goal: 10 });
      const punchcard = mockPunchcard({ punches: 0, update: jest.fn().mockResolvedValue(true) });

      User.findOne.mockResolvedValueOnce(user);
      Business.findOne.mockResolvedValueOnce(business);
      Punchcard.findOrCreate.mockResolvedValueOnce([punchcard, true]);
      Visit.findOne.mockResolvedValueOnce(null);
      Visit.create.mockResolvedValueOnce({});

      const res = await request(app)
        .post('/api/punch')
        .send({ customer_username: 'customer', business_username: 'business' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Punch recorded.');
    });

    it('should reset punchcard when goal is reached', async () => {
      const user = mockUser({ username: 'customer' });
      const business = mockBusiness({ username: 'business', status: 'approved', storeId: 1, goal: 5 });
      const punchcard = mockPunchcard({ punches: 4, update: jest.fn().mockResolvedValue(true) });

      User.findOne.mockResolvedValueOnce(user);
      Business.findOne.mockResolvedValueOnce(business);
      Punchcard.findOrCreate.mockResolvedValueOnce([punchcard, false]);
      Visit.findOne.mockResolvedValueOnce(null);
      Visit.create.mockResolvedValueOnce({});

      const res = await request(app)
        .post('/api/punch')
        .send({ customer_username: 'customer', business_username: 'business' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Goal reached! Card reset.');
      expect(res.body.punches).toBe(0);
    });
  });
});
