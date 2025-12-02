/**
 * Proximity Utils Tests
 */

import {
  calculateDistance,
  cacheNearbyStores,
  getCachedStores,
  getStartingLocation,
  addVisitDenial,
  getVisitDenials,
  isDenied,
  markVisitedToday,
  getDailyVisits,
  hasVisitedToday,
  findNearbyStores,
  filterEligibleStores,
  shouldRefreshStoreList
} from '../proximityUtils';

describe('proximityUtils', () => {
  beforeEach(() => {
    // localStorage is automatically reset by setupTests.js
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ========================================
  // Distance Calculation Tests
  // ========================================
  describe('calculateDistance', () => {
    it('should return 0 for identical coordinates', () => {
      const distance = calculateDistance(40.7128, -74.0060, 40.7128, -74.0060);
      expect(distance).toBe(0);
    });

    it('should calculate distance correctly between two points', () => {
      // Times Square to Empire State Building (approximately 800m)
      const timesSquare = { lat: 40.7580, lng: -73.9855 };
      const empireState = { lat: 40.7484, lng: -73.9857 };

      const distance = calculateDistance(
        timesSquare.lat, timesSquare.lng,
        empireState.lat, empireState.lng
      );

      // Should be approximately 1000 meters
      expect(distance).toBeGreaterThan(900);
      expect(distance).toBeLessThan(1200);
    });

    it('should calculate short distances (within 15m)', () => {
      // Two points very close together
      const lat1 = 40.7128;
      const lng1 = -74.0060;
      const lat2 = 40.71285; // About 5 meters north
      const lng2 = -74.0060;

      const distance = calculateDistance(lat1, lng1, lat2, lng2);

      expect(distance).toBeLessThan(15);
      expect(distance).toBeGreaterThan(0);
    });

    it('should handle cross-hemisphere calculations', () => {
      // New York to Sydney (approximately 16,000km)
      const nyLat = 40.7128, nyLng = -74.0060;
      const sydLat = -33.8688, sydLng = 151.2093;

      const distance = calculateDistance(nyLat, nyLng, sydLat, sydLng);

      // Should be approximately 16,000,000 meters
      expect(distance).toBeGreaterThan(15000000);
      expect(distance).toBeLessThan(17000000);
    });
  });

  // ========================================
  // Cache Management Tests
  // ========================================
  describe('cacheNearbyStores', () => {
    it('should cache stores to localStorage', () => {
      const stores = [
        { id: 1, name: 'Store 1', latitude: 40.7128, longitude: -74.0060, address: '123 Main St', isVerified: false },
        { id: 2, name: 'Store 2', latitude: 40.7130, longitude: -74.0062, address: '456 Oak Ave', isVerified: true }
      ];
      const startingLocation = { lat: 40.7128, lng: -74.0060 };

      cacheNearbyStores(stores, startingLocation);

      const cachedStores = JSON.parse(localStorage.getItem('pf_saved_stores_cache'));
      const cachedLocation = JSON.parse(localStorage.getItem('pf_starting_location'));

      expect(cachedStores).toHaveLength(2);
      expect(cachedStores[0].name).toBe('Store 1');
      expect(cachedLocation).toEqual(startingLocation);
    });
  });

  describe('getCachedStores', () => {
    it('should return empty array when no stores cached', () => {
      const stores = getCachedStores();
      expect(stores).toEqual([]);
    });

    it('should return cached stores', () => {
      const stores = [{ id: 1, name: 'Test Store', latitude: 40.7128, longitude: -74.0060 }];
      const startingLocation = { lat: 40.7128, lng: -74.0060 };
      cacheNearbyStores(stores, startingLocation);

      const cached = getCachedStores();

      expect(cached).toHaveLength(1);
      expect(cached[0].name).toBe('Test Store');
    });
  });

  describe('getStartingLocation', () => {
    it('should return null when no location cached', () => {
      const location = getStartingLocation();
      expect(location).toBeNull();
    });

    it('should return cached starting location', () => {
      const stores = [{ id: 1, name: 'Store', latitude: 40.7128, longitude: -74.0060 }];
      const startingLocation = { lat: 40.7128, lng: -74.0060 };
      cacheNearbyStores(stores, startingLocation);

      const location = getStartingLocation();

      expect(location).toEqual(startingLocation);
    });
  });

  // ========================================
  // Denial Management Tests
  // ========================================
  describe('addVisitDenial', () => {
    it('should add denial with 1 hour expiration', () => {
      const now = new Date('2024-01-15T10:00:00Z').getTime();
      jest.setSystemTime(now);

      addVisitDenial(1);

      const denials = JSON.parse(localStorage.getItem('pf_visit_denials'));
      expect(denials).toHaveProperty('1');
      expect(denials['1'].expiresAt).toBe(now + (60 * 60 * 1000));
    });
  });

  describe('isDenied', () => {
    it('should return true for denied store', () => {
      const now = new Date('2024-01-15T10:00:00Z').getTime();
      jest.setSystemTime(now);

      addVisitDenial(1);

      expect(isDenied(1)).toBe(true);
    });

    it('should return false for non-denied store', () => {
      expect(isDenied(999)).toBe(false);
    });

    it('should return false after denial expires (1 hour)', () => {
      const now = new Date('2024-01-15T10:00:00Z').getTime();
      jest.setSystemTime(now);

      addVisitDenial(1);

      // Advance time by 61 minutes
      jest.setSystemTime(now + 61 * 60 * 1000);

      expect(isDenied(1)).toBe(false);
    });

    it('should return true before denial expires', () => {
      const now = new Date('2024-01-15T10:00:00Z').getTime();
      jest.setSystemTime(now);

      addVisitDenial(1);

      // Advance time by 30 minutes (still within 1 hour)
      jest.setSystemTime(now + 30 * 60 * 1000);

      expect(isDenied(1)).toBe(true);
    });
  });

  describe('getVisitDenials', () => {
    it('should return empty object when no denials', () => {
      const denials = getVisitDenials();
      expect(denials).toEqual({});
    });

    it('should filter out expired denials', () => {
      const now = new Date('2024-01-15T10:00:00Z').getTime();
      jest.setSystemTime(now);

      addVisitDenial(1);
      addVisitDenial(2);

      // Advance time past expiration
      jest.setSystemTime(now + 61 * 60 * 1000);

      const denials = getVisitDenials();
      expect(Object.keys(denials)).toHaveLength(0);
    });
  });

  // ========================================
  // Daily Visit Tracking Tests
  // ========================================
  describe('markVisitedToday', () => {
    it('should mark store as visited today', () => {
      markVisitedToday(1);

      const visits = JSON.parse(localStorage.getItem('pf_daily_visits'));
      expect(visits).toHaveProperty('1');
      expect(visits['1'].visited).toBe(true);
    });
  });

  describe('hasVisitedToday', () => {
    it('should return true for visited store', () => {
      markVisitedToday(1);

      expect(hasVisitedToday(1)).toBe(true);
    });

    it('should return false for non-visited store', () => {
      expect(hasVisitedToday(999)).toBe(false);
    });

    it('should return false after day changes', () => {
      // Visit on Jan 15
      const jan15 = new Date('2024-01-15T10:00:00Z');
      jest.setSystemTime(jan15);
      markVisitedToday(1);

      // Check on Jan 16
      const jan16 = new Date('2024-01-16T10:00:00Z');
      jest.setSystemTime(jan16);

      expect(hasVisitedToday(1)).toBe(false);
    });
  });

  describe('getDailyVisits', () => {
    it('should return empty object when no visits', () => {
      const visits = getDailyVisits();
      expect(visits).toEqual({});
    });

    it('should filter out old visits', () => {
      // Visit on Jan 15
      const jan15 = new Date('2024-01-15T10:00:00Z');
      jest.setSystemTime(jan15);
      markVisitedToday(1);

      // Check on Jan 16
      const jan16 = new Date('2024-01-16T10:00:00Z');
      jest.setSystemTime(jan16);

      const visits = getDailyVisits();
      expect(Object.keys(visits)).toHaveLength(0);
    });
  });

  // ========================================
  // Proximity Detection Tests
  // ========================================
  describe('findNearbyStores', () => {
    it('should return empty array when no current location', () => {
      const stores = [{ id: 1, latitude: 40.7128, longitude: -74.0060 }];
      const nearby = findNearbyStores(null, stores);
      expect(nearby).toEqual([]);
    });

    it('should return empty array when no cached stores', () => {
      const location = { lat: 40.7128, lng: -74.0060 };
      const nearby = findNearbyStores(location, []);
      expect(nearby).toEqual([]);
    });

    it('should return stores within 15 meters', () => {
      const location = { lat: 40.7128, lng: -74.0060 };
      const stores = [
        { id: 1, latitude: 40.7128, longitude: -74.0060, name: 'Same spot' },        // 0m away
        { id: 2, latitude: 40.71281, longitude: -74.0060, name: 'Very close' },      // ~1m away
        { id: 3, latitude: 40.7130, longitude: -74.0060, name: 'Too far' }           // ~22m away
      ];

      const nearby = findNearbyStores(location, stores);

      expect(nearby).toHaveLength(2);
      expect(nearby.map(s => s.id)).toContain(1);
      expect(nearby.map(s => s.id)).toContain(2);
      expect(nearby.map(s => s.id)).not.toContain(3);
    });

    it('should sort by distance (closest first)', () => {
      const location = { lat: 40.7128, lng: -74.0060 };
      const stores = [
        { id: 1, latitude: 40.71281, longitude: -74.0060, name: 'Close' },
        { id: 2, latitude: 40.7128, longitude: -74.0060, name: 'Closest' }
      ];

      const nearby = findNearbyStores(location, stores);

      expect(nearby[0].id).toBe(2); // Closest first
      expect(nearby[1].id).toBe(1);
    });

    it('should include distance in returned stores', () => {
      const location = { lat: 40.7128, lng: -74.0060 };
      const stores = [{ id: 1, latitude: 40.7128, longitude: -74.0060 }];

      const nearby = findNearbyStores(location, stores);

      expect(nearby[0]).toHaveProperty('distance');
      expect(nearby[0].distance).toBe(0);
    });
  });

  describe('filterEligibleStores', () => {
    it('should exclude denied stores', () => {
      const now = new Date('2024-01-15T10:00:00Z').getTime();
      jest.setSystemTime(now);

      addVisitDenial(1);

      const stores = [
        { id: 1, name: 'Denied Store' },
        { id: 2, name: 'OK Store' }
      ];

      const eligible = filterEligibleStores(stores);

      expect(eligible).toHaveLength(1);
      expect(eligible[0].id).toBe(2);
    });

    it('should exclude stores visited today', () => {
      markVisitedToday(1);

      const stores = [
        { id: 1, name: 'Visited Store' },
        { id: 2, name: 'Not Visited Store' }
      ];

      const eligible = filterEligibleStores(stores);

      expect(eligible).toHaveLength(1);
      expect(eligible[0].id).toBe(2);
    });

    it('should exclude both denied and visited stores', () => {
      const now = new Date('2024-01-15T10:00:00Z').getTime();
      jest.setSystemTime(now);

      addVisitDenial(1);
      markVisitedToday(2);

      const stores = [
        { id: 1, name: 'Denied' },
        { id: 2, name: 'Visited' },
        { id: 3, name: 'Eligible' }
      ];

      const eligible = filterEligibleStores(stores);

      expect(eligible).toHaveLength(1);
      expect(eligible[0].id).toBe(3);
    });

    it('should return all stores when none denied or visited', () => {
      const stores = [
        { id: 1, name: 'Store 1' },
        { id: 2, name: 'Store 2' }
      ];

      const eligible = filterEligibleStores(stores);

      expect(eligible).toHaveLength(2);
    });
  });

  // ========================================
  // Refresh Detection Tests
  // ========================================
  describe('shouldRefreshStoreList', () => {
    it('should return false when no current location', () => {
      const stores = [{ id: 1, latitude: 40.7128, longitude: -74.0060 }];
      const startingLocation = { lat: 40.7128, lng: -74.0060 };

      const result = shouldRefreshStoreList(null, stores, startingLocation);

      expect(result).toBe(false);
    });

    it('should return false when no starting location', () => {
      const stores = [{ id: 1, latitude: 40.7128, longitude: -74.0060 }];
      const currentLocation = { lat: 40.7128, lng: -74.0060 };

      const result = shouldRefreshStoreList(currentLocation, stores, null);

      expect(result).toBe(false);
    });

    it('should return false when no cached stores', () => {
      const currentLocation = { lat: 40.7128, lng: -74.0060 };
      const startingLocation = { lat: 40.7128, lng: -74.0060 };

      const result = shouldRefreshStoreList(currentLocation, [], startingLocation);

      expect(result).toBe(false);
    });

    it('should return false when still within cached area', () => {
      const startingLocation = { lat: 40.7128, lng: -74.0060 };
      const stores = [
        { id: 1, latitude: 40.7130, longitude: -74.0060 } // ~22m from start
      ];
      const currentLocation = { lat: 40.7129, lng: -74.0060 }; // ~11m from start

      const result = shouldRefreshStoreList(currentLocation, stores, startingLocation);

      expect(result).toBe(false);
    });

    it('should return true when beyond furthest cached store', () => {
      const startingLocation = { lat: 40.7128, lng: -74.0060 };
      const stores = [
        { id: 1, latitude: 40.7129, longitude: -74.0060 } // ~11m from start
      ];
      const currentLocation = { lat: 40.7140, lng: -74.0060 }; // ~133m from start

      const result = shouldRefreshStoreList(currentLocation, stores, startingLocation);

      expect(result).toBe(true);
    });
  });
});
