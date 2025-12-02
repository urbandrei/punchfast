/**
 * API Mock Utilities - Mock fetch for testing
 */

/**
 * Create a mock fetch function with configurable responses
 * @param {Object} responses - Map of endpoint patterns to response configs
 * @returns {jest.Mock} Mocked fetch function
 */
export const createMockFetch = (responses = {}) => {
  return jest.fn((url, options = {}) => {
    // Extract the pathname from the URL
    const endpoint = url.replace(/\?.*$/, '');

    // Find matching response
    const matchingKey = Object.keys(responses).find(key => {
      if (key.includes('*')) {
        const regex = new RegExp('^' + key.replace(/\*/g, '.*') + '$');
        return regex.test(endpoint);
      }
      return endpoint === key || endpoint.endsWith(key);
    });

    const response = matchingKey ? responses[matchingKey] : null;

    if (response) {
      // Allow response to be a function for dynamic responses
      const resolvedResponse = typeof response === 'function'
        ? response(url, options)
        : response;

      return Promise.resolve({
        ok: resolvedResponse.ok !== false,
        status: resolvedResponse.status || (resolvedResponse.ok !== false ? 200 : 400),
        json: () => Promise.resolve(resolvedResponse.data || resolvedResponse.json || {}),
        text: () => Promise.resolve(resolvedResponse.text || ''),
        headers: new Headers(resolvedResponse.headers || {})
      });
    }

    // Default 404 response
    return Promise.resolve({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: 'Not found' }),
      text: () => Promise.resolve('Not found')
    });
  });
};

/**
 * Create mock responses for common API endpoints
 * @param {Object} overrides - Override specific responses
 * @returns {Object} Response map
 */
export const createDefaultApiResponses = (overrides = {}) => ({
  // Auth endpoints
  '/api/login': {
    ok: true,
    data: {
      user: { id: 1, username: 'testuser', isAdmin: false },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token'
    }
  },
  '/api/signup': {
    ok: true,
    data: {
      user: { id: 1, username: 'testuser' },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token'
    }
  },
  '/api/session': {
    ok: true,
    data: {
      session: { userId: 1, username: 'testuser', isAdmin: false }
    }
  },
  '/api/refresh-token': {
    ok: true,
    data: {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token'
    }
  },
  '/api/logout': { ok: true, data: { message: 'Logged out' } },

  // Business endpoints
  '/api/business/login': {
    ok: true,
    data: {
      business: { id: 1, username: 'testbusiness', status: 'approved' },
      accessToken: 'mock-business-access-token',
      refreshToken: 'mock-business-refresh-token'
    }
  },
  '/api/business/session': {
    ok: true,
    data: {
      session: { userId: 1, username: 'testbusiness', type: 'business' }
    }
  },

  // Store endpoints
  '/api/stores/nearby': {
    ok: true,
    data: {
      stores: [],
      count: 0,
      hasMore: false
    }
  },

  // Route endpoints
  '/api/routes/nearby': {
    ok: true,
    data: {
      routes: [],
      count: 0
    }
  },

  // Achievement endpoints
  '/api/achievements': {
    ok: true,
    data: {
      achievements: []
    }
  },

  ...overrides
});

/**
 * Setup global fetch mock with default responses
 * @param {Object} customResponses - Custom response overrides
 * @returns {jest.Mock} The mock fetch function
 */
export const setupFetchMock = (customResponses = {}) => {
  const responses = createDefaultApiResponses(customResponses);
  const mockFetch = createMockFetch(responses);
  global.fetch = mockFetch;
  return mockFetch;
};

/**
 * Reset fetch to original implementation
 */
export const resetFetchMock = () => {
  if (global.fetch && global.fetch.mockRestore) {
    global.fetch.mockRestore();
  }
};
