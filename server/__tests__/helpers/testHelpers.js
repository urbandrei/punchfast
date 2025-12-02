const jwt = require('jsonwebtoken');

// Use test secrets (set in setup.js)
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-jwt-access-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-jwt-refresh-secret-key';

/**
 * Generate a valid access token for testing
 * @param {Object} payload - Token payload
 * @returns {String} JWT access token
 */
function generateValidToken(payload = {}) {
  const defaultPayload = {
    id: 1,
    username: 'testuser',
    type: 'user',
    isAdmin: false,
    ...payload
  };

  return jwt.sign(defaultPayload, JWT_ACCESS_SECRET, {
    expiresIn: '1h',
    issuer: 'punchfast-api'
  });
}

/**
 * Generate an admin access token for testing
 * @param {Object} payload - Additional payload
 * @returns {String} JWT access token with admin privileges
 */
function generateAdminToken(payload = {}) {
  return generateValidToken({
    id: 999,
    username: 'admin',
    type: 'user',
    isAdmin: true,
    ...payload
  });
}

/**
 * Generate a business access token for testing
 * @param {Object} payload - Additional payload
 * @returns {String} JWT access token for business
 */
function generateBusinessToken(payload = {}) {
  const defaultPayload = {
    id: 1,
    username: 'testbusiness',
    type: 'business',
    storeId: null,
    ...payload
  };

  return jwt.sign(defaultPayload, JWT_ACCESS_SECRET, {
    expiresIn: '1h',
    issuer: 'punchfast-api'
  });
}

/**
 * Generate a valid refresh token for testing
 * @param {Object} payload - Token payload
 * @returns {String} JWT refresh token
 */
function generateValidRefreshToken(payload = {}) {
  const defaultPayload = {
    id: 1,
    username: 'testuser',
    type: 'user',
    ...payload
  };

  return jwt.sign(defaultPayload, JWT_REFRESH_SECRET, {
    expiresIn: '30d',
    issuer: 'punchfast-api'
  });
}

/**
 * Generate an expired access token for testing
 * @param {Object} payload - Token payload
 * @returns {String} Expired JWT token
 */
function generateExpiredToken(payload = {}) {
  const defaultPayload = {
    id: 1,
    username: 'testuser',
    type: 'user',
    isAdmin: false,
    ...payload
  };

  return jwt.sign(defaultPayload, JWT_ACCESS_SECRET, {
    expiresIn: '-1h', // Already expired
    issuer: 'punchfast-api'
  });
}

/**
 * Generate an expired refresh token for testing
 * @param {Object} payload - Token payload
 * @returns {String} Expired JWT refresh token
 */
function generateExpiredRefreshToken(payload = {}) {
  const defaultPayload = {
    id: 1,
    username: 'testuser',
    type: 'user',
    ...payload
  };

  return jwt.sign(defaultPayload, JWT_REFRESH_SECRET, {
    expiresIn: '-1h',
    issuer: 'punchfast-api'
  });
}

/**
 * Create a mock user object
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock user
 */
function mockUser(overrides = {}) {
  return {
    id: 1,
    username: 'testuser',
    password: '$2a$10$hashedpassword',
    isAdmin: false,
    visits: 0,
    routes_started: 0,
    routes_completed: 0,
    questions_answered: 0,
    refreshToken: null,
    refreshTokenCreatedAt: null,
    refreshTokenExpiresAt: null,
    deviceInfo: null,
    lastLoginIp: null,
    created_at: new Date(),
    updated_at: new Date(),
    update: jest.fn().mockResolvedValue(true),
    save: jest.fn().mockResolvedValue(true),
    ...overrides
  };
}

/**
 * Create a mock admin user object
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock admin user
 */
function mockAdminUser(overrides = {}) {
  return mockUser({
    id: 999,
    username: 'admin',
    isAdmin: true,
    ...overrides
  });
}

/**
 * Create a mock business object
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock business
 */
function mockBusiness(overrides = {}) {
  return {
    id: 1,
    username: 'testbusiness',
    password: '$2a$10$hashedpassword',
    status: 'approved',
    goal: 10,
    storeId: null,
    refreshToken: null,
    refreshTokenCreatedAt: null,
    refreshTokenExpiresAt: null,
    deviceInfo: null,
    lastLoginIp: null,
    created_at: new Date(),
    updated_at: new Date(),
    update: jest.fn().mockResolvedValue(true),
    save: jest.fn().mockResolvedValue(true),
    ...overrides
  };
}

/**
 * Create a mock store object
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock store
 */
function mockStore(overrides = {}) {
  return {
    id: 1,
    osm_id: '123456789',
    osm_type: 'node',
    name: 'Test Store',
    latitude: 40.7128,
    longitude: -74.0060,
    address: '123 Test St, New York, NY 10001',
    amenity: 'cafe',
    shop: null,
    cuisine: 'coffee',
    website: 'https://teststore.com',
    phone: '+1-555-0123',
    status: 'active',
    created_at: new Date(),
    updated_at: new Date(),
    update: jest.fn().mockResolvedValue(true),
    save: jest.fn().mockResolvedValue(true),
    ...overrides
  };
}

/**
 * Create a mock route object
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock route
 */
function mockRoute(overrides = {}) {
  return {
    id: 1,
    name: 'Test Route',
    routeType: 'walking',
    isAutoGenerated: false,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides
  };
}

/**
 * Create a mock visit object
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock visit
 */
function mockVisit(overrides = {}) {
  return {
    id: 1,
    userId: 1,
    storeId: 1,
    visitDate: new Date(),
    shouldShowQuestionnaire: false,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides
  };
}

/**
 * Create a mock punchcard object
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock punchcard
 */
function mockPunchcard(overrides = {}) {
  return {
    id: 1,
    customer_username: 'testuser',
    business_username: 'testbusiness',
    punches: 0,
    created_at: new Date(),
    updated_at: new Date(),
    save: jest.fn().mockResolvedValue(true),
    ...overrides
  };
}

/**
 * Create a mock achievement object
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock achievement
 */
function mockAchievement(overrides = {}) {
  return {
    id: 1,
    name: 'First Visit',
    description: 'Visit your first store',
    type: 'visits',
    condition: 1,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides
  };
}

/**
 * Create a mock report object
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock report
 */
function mockReport(overrides = {}) {
  const now = new Date();
  return {
    id: 1,
    reportedItemType: 'store',
    reportedItemId: 1,
    reporterId: 1,
    category: 'wrong_location',
    description: 'Test report description',
    status: 'pending',
    adminNotes: null,
    reviewedBy: null,
    reviewedAt: null,
    created_at: now,
    updated_at: now,
    createdAt: now,  // Include camelCase version for controller access
    updatedAt: now,
    update: jest.fn().mockResolvedValue(true),
    save: jest.fn().mockResolvedValue(true),
    ...overrides
  };
}

module.exports = {
  generateValidToken,
  generateAdminToken,
  generateBusinessToken,
  generateValidRefreshToken,
  generateExpiredToken,
  generateExpiredRefreshToken,
  mockUser,
  mockAdminUser,
  mockBusiness,
  mockStore,
  mockRoute,
  mockVisit,
  mockPunchcard,
  mockAchievement,
  mockReport
};
