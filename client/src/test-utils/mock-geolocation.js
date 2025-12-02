/**
 * Geolocation Mock Utilities - Mock navigator.geolocation for testing
 */

/**
 * Create a mock geolocation object
 * @param {Object} options - Configuration options
 * @param {Object} options.position - Default position to return
 * @param {boolean} options.shouldError - If true, calls will fail
 * @param {Object} options.error - Error object to return on failure
 * @returns {Object} Mock geolocation object
 */
export const createMockGeolocation = (options = {}) => {
  const defaultPosition = {
    coords: {
      latitude: 40.7128,
      longitude: -74.0060,
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null
    },
    timestamp: Date.now()
  };

  const position = options.position || defaultPosition;
  const shouldError = options.shouldError || false;
  const errorObj = options.error || {
    code: 1,
    message: 'User denied geolocation',
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3
  };

  const watchCallbacks = new Map();
  let watchIdCounter = 0;

  return {
    getCurrentPosition: jest.fn((success, error, opts) => {
      if (shouldError) {
        if (error) {
          setTimeout(() => error(errorObj), 0);
        }
      } else {
        setTimeout(() => success(position), 0);
      }
    }),

    watchPosition: jest.fn((success, error, opts) => {
      const id = ++watchIdCounter;
      watchCallbacks.set(id, { success, error });

      if (shouldError) {
        if (error) {
          setTimeout(() => error(errorObj), 0);
        }
      } else {
        setTimeout(() => success(position), 0);
      }

      return id;
    }),

    clearWatch: jest.fn((id) => {
      watchCallbacks.delete(id);
    }),

    // Test helper: simulate a position update
    _simulatePositionUpdate: (newPosition) => {
      const positionUpdate = {
        coords: {
          ...defaultPosition.coords,
          ...newPosition.coords
        },
        timestamp: newPosition.timestamp || Date.now()
      };

      watchCallbacks.forEach(({ success }) => {
        if (success) {
          success(positionUpdate);
        }
      });
    },

    // Test helper: simulate an error
    _simulateError: (error = errorObj) => {
      watchCallbacks.forEach(({ error: errorCb }) => {
        if (errorCb) {
          errorCb(error);
        }
      });
    },

    // Test helper: get watch callback count
    _getWatchCount: () => watchCallbacks.size
  };
};

/**
 * Setup global navigator.geolocation mock
 * @param {Object} options - Configuration options
 * @returns {Object} Mock geolocation object with test helpers
 */
export const setupGeolocationMock = (options = {}) => {
  const mock = createMockGeolocation(options);

  Object.defineProperty(navigator, 'geolocation', {
    value: mock,
    writable: true,
    configurable: true
  });

  return mock;
};

/**
 * Create a position object for testing
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {Object} extras - Additional coords properties
 * @returns {Object} Position object
 */
export const createPosition = (lat, lng, extras = {}) => ({
  coords: {
    latitude: lat,
    longitude: lng,
    accuracy: 10,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
    ...extras
  },
  timestamp: Date.now()
});
