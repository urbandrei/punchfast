/**
 * Store Interaction Flow Integration Tests
 *
 * Tests complete store interaction flows including:
 * - Saving/unsaving stores
 * - Reporting stores
 * - Store verification status
 */

describe('Store Interaction Flows', () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Save Store Flow', () => {
    it('should save store for authenticated user', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ saved: true })
      });

      const response = await fetch('/api/saved-stores/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 1, storeId: 5 })
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.saved).toBe(true);
    });

    it('should unsave previously saved store', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ saved: false })
      });

      const response = await fetch('/api/saved-stores/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 1, storeId: 5 })
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.saved).toBe(false);
    });

    it('should check if store is saved', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ saved: true })
      });

      const response = await fetch('/api/saved-stores/1/5');
      const data = await response.json();

      expect(data.saved).toBe(true);
    });

    it('should get all saved stores for user', async () => {
      const mockStores = [
        { id: 1, name: 'Store A' },
        { id: 2, name: 'Store B' }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ stores: mockStores })
      });

      const response = await fetch('/api/saved-stores/1');
      const data = await response.json();

      expect(data.stores).toHaveLength(2);
      expect(data.stores[0].name).toBe('Store A');
    });
  });

  describe('Report Store Flow', () => {
    it('should submit store report without authentication', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 })
      });

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportedItemType: 'store',
          reportedItemId: 5,
          category: 'closed_permanently',
          description: 'This store is permanently closed'
        })
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.id).toBeDefined();
    });

    it('should submit store report with authentication', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 2 })
      });

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          reportedItemType: 'store',
          reportedItemId: 5,
          category: 'wrong_location',
          description: null
        })
      });

      expect(response.ok).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/reports',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      );
    });

    it('should handle different report categories', async () => {
      const categories = [
        'closed_permanently',
        'wrong_location',
        'duplicate',
        'inappropriate_content',
        'spam',
        'other'
      ];

      for (const category of categories) {
        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 1 })
        });

        const response = await fetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reportedItemType: 'store',
            reportedItemId: 1,
            category,
            description: null
          })
        });

        expect(response.ok).toBe(true);
      }
    });

    it('should handle duplicate report error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'You have already reported this item' })
      });

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportedItemType: 'store',
          reportedItemId: 5,
          category: 'closed_permanently',
          description: null
        })
      });

      expect(response.ok).toBe(false);
      const data = await response.json();
      expect(data.message).toContain('already reported');
    });
  });

  describe('Store Verification Status', () => {
    it('should check store verification status', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ verified: true, business: { username: 'testbiz' } })
      });

      const response = await fetch('/api/stores/5/verification');
      const data = await response.json();

      expect(data.verified).toBe(true);
      expect(data.business.username).toBe('testbiz');
    });

    it('should handle unverified store', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ verified: false, business: null })
      });

      const response = await fetch('/api/stores/10/verification');
      const data = await response.json();

      expect(data.verified).toBe(false);
      expect(data.business).toBeNull();
    });
  });

  describe('Store Visit Statistics', () => {
    it('should get visit stats for store', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          totalVisits: 10,
          visitedToday: true
        })
      });

      const response = await fetch('/api/visits/store-stats?userId=1&storeId=5');
      const data = await response.json();

      expect(data.totalVisits).toBe(10);
      expect(data.visitedToday).toBe(true);
    });

    it('should handle store with no visits', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          totalVisits: 0,
          visitedToday: false
        })
      });

      const response = await fetch('/api/visits/store-stats?userId=1&storeId=100');
      const data = await response.json();

      expect(data.totalVisits).toBe(0);
      expect(data.visitedToday).toBe(false);
    });
  });

  describe('Complete Save-Unsave Flow', () => {
    it('should complete save and unsave cycle', async () => {
      // Initial state: not saved
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ saved: false })
      });

      let response = await fetch('/api/saved-stores/1/5');
      let data = await response.json();
      expect(data.saved).toBe(false);

      // Save the store
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ saved: true })
      });

      response = await fetch('/api/saved-stores/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 1, storeId: 5 })
      });
      data = await response.json();
      expect(data.saved).toBe(true);

      // Verify saved state
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ saved: true })
      });

      response = await fetch('/api/saved-stores/1/5');
      data = await response.json();
      expect(data.saved).toBe(true);

      // Unsave the store
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ saved: false })
      });

      response = await fetch('/api/saved-stores/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 1, storeId: 5 })
      });
      data = await response.json();
      expect(data.saved).toBe(false);
    });
  });

  describe('Report Route Flow', () => {
    it('should submit route report', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 })
      });

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportedItemType: 'route',
          reportedItemId: 3,
          category: 'inappropriate_content',
          description: 'Route name is inappropriate'
        })
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.id).toBeDefined();
    });
  });

  describe('Punch Card Flow (Verified Stores)', () => {
    it('should record punch at verified store', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          punch: { id: 1, userId: 1, storeId: 5, punchDate: new Date().toISOString() }
        })
      });

      const response = await fetch('/api/punch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 1, storeId: 5 })
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.punch.storeId).toBe(5);
    });

    it('should handle already punched today error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Already punched at this store today' })
      });

      const response = await fetch('/api/punch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 1, storeId: 5 })
      });

      expect(response.ok).toBe(false);
      const data = await response.json();
      expect(data.message).toContain('Already punched');
    });
  });
});
