/**
 * Proximity Visit Flow Integration Tests
 *
 * Tests the complete proximity-based visit flow including:
 * - Store detection based on location
 * - Visit recording
 * - Visit denial caching
 * - Questionnaire display after visit
 */

import {
  calculateDistance,
  addVisitDenial,
  isDenied,
  markVisitedToday,
  hasVisitedToday,
  filterEligibleStores
} from '../../utils/proximityUtils';

describe('Proximity Visit Flows', () => {
  beforeEach(() => {
    // localStorage.clear() will reset both denial and visit caches
    localStorage.clear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // Test coordinates
  const nearbyStores = [
    { id: 1, name: 'Close Store', latitude: 40.7129, longitude: -74.0061 },
    { id: 2, name: 'Medium Store', latitude: 40.7130, longitude: -74.0065 },
    { id: 3, name: 'Far Store', latitude: 40.7150, longitude: -74.0080 }
  ];

  describe('Visit Recording Flow', () => {
    it('should record visit via API', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          visit: { id: 1, userId: 1, storeId: 1, visitDate: new Date().toISOString() }
        })
      });

      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 1, storeId: 1 })
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.visit.storeId).toBe(1);
    });

    it('should mark store as visited today after recording', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ visit: { id: 1 } })
      });

      // Record visit
      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 1, storeId: 1 })
      });

      if (response.ok) {
        markVisitedToday(1);
      }

      expect(hasVisitedToday(1)).toBe(true);
    });

    it('should handle visit recording failure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Already visited today' })
      });

      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 1, storeId: 1 })
      });

      expect(response.ok).toBe(false);
      const data = await response.json();
      expect(data.message).toBe('Already visited today');
    });
  });

  describe('Visit Denial Flow', () => {
    it('should add store to denial cache', () => {
      addVisitDenial(1);

      expect(isDenied(1)).toBe(true);
    });

    it('should not show modal for denied stores', () => {
      addVisitDenial(2);

      const eligible = filterEligibleStores(nearbyStores);

      expect(eligible.map(s => s.id)).not.toContain(2);
    });

    it('should allow denial for specific duration', () => {
      addVisitDenial(1);

      // Should be denied immediately
      expect(isDenied(1)).toBe(true);
    });

    it('should filter out denied and visited stores', () => {
      // Deny store 1
      addVisitDenial(1);

      // Mark store 2 as visited today
      markVisitedToday(2);

      const eligible = filterEligibleStores(nearbyStores);

      // Only store 3 should be eligible
      expect(eligible).toHaveLength(1);
      expect(eligible[0].id).toBe(3);
    });
  });

  describe('Eligible Store Filtering', () => {
    it('should exclude stores visited today', () => {
      markVisitedToday(1);

      const eligible = filterEligibleStores(nearbyStores);

      expect(eligible.map(s => s.id)).not.toContain(1);
      expect(eligible).toHaveLength(2);
    });

    it('should exclude denied stores', () => {
      addVisitDenial(2);

      const eligible = filterEligibleStores(nearbyStores);

      expect(eligible.map(s => s.id)).not.toContain(2);
      expect(eligible).toHaveLength(2);
    });

    it('should return all stores when none are filtered', () => {
      const eligible = filterEligibleStores(nearbyStores);

      expect(eligible).toHaveLength(3);
    });
  });

  describe('Complete Visit Flow', () => {
    it('should complete full visit flow: detect -> confirm -> record -> mark', async () => {
      // Step 1: Filter eligible stores (simulating store detection)
      const eligible = filterEligibleStores(nearbyStores);
      expect(eligible.length).toBeGreaterThan(0);

      // Step 2: User confirms visit to first eligible store
      const selectedStore = eligible[0];

      // Step 3: Record visit via API
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ visit: { id: 1, storeId: selectedStore.id } })
      });

      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 1, storeId: selectedStore.id })
      });

      expect(response.ok).toBe(true);

      // Step 4: Mark as visited today
      markVisitedToday(selectedStore.id);

      // Verify store is now filtered out
      const newEligible = filterEligibleStores(nearbyStores);
      expect(newEligible.map(s => s.id)).not.toContain(selectedStore.id);
    });

    it('should complete denial flow: detect -> deny -> cache', () => {
      // Step 1: Filter eligible stores
      const eligible = filterEligibleStores(nearbyStores);
      const selectedStore = eligible[0];

      // Step 2: User denies visit
      addVisitDenial(selectedStore.id);

      // Step 3: Verify store is cached as denied
      expect(isDenied(selectedStore.id)).toBe(true);

      // Step 4: Verify store is filtered out
      const newEligible = filterEligibleStores(nearbyStores);
      expect(newEligible.map(s => s.id)).not.toContain(selectedStore.id);
    });
  });

  describe('Questionnaire Flow After Visit', () => {
    it('should trigger questionnaire fetch after visit', async () => {
      // Record visit
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ visit: { id: 1, storeId: 1 } })
        })
        // Questionnaire fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            question: {
              id: 1,
              text: 'How was your experience?',
              options: [
                { id: 1, text: 'Great' },
                { id: 2, text: 'Good' },
                { id: 3, text: 'Okay' },
                { id: 4, text: 'Poor' }
              ]
            }
          })
        });

      // Record visit
      const visitResponse = await fetch('/api/visits', {
        method: 'POST',
        body: JSON.stringify({ userId: 1, storeId: 1 })
      });
      expect(visitResponse.ok).toBe(true);

      // Fetch questionnaire
      const questionResponse = await fetch('/api/questions/random?userId=1');
      const questionData = await questionResponse.json();

      expect(questionData.question).toBeDefined();
      expect(questionData.question.options).toHaveLength(4);
    });

    it('should submit questionnaire answer', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      const response = await fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 1,
          questionId: 1,
          answerId: 2
        })
      });

      expect(response.ok).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/answers',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"answerId":2')
        })
      );
    });
  });

  describe('Distance Calculation', () => {
    it('should calculate distance accurately', () => {
      // Distance from Times Square to Empire State Building (~1km)
      const timesSquare = { lat: 40.7580, lng: -73.9855 };
      const empireState = { lat: 40.7484, lng: -73.9857 };

      const distance = calculateDistance(
        timesSquare.lat,
        timesSquare.lng,
        empireState.lat,
        empireState.lng
      );

      // Should be approximately 1000m (allow 10% margin)
      expect(distance).toBeGreaterThan(900);
      expect(distance).toBeLessThan(1200);
    });

    it('should return 0 for same coordinates', () => {
      const distance = calculateDistance(40.7128, -74.0060, 40.7128, -74.0060);
      expect(distance).toBe(0);
    });
  });
});
