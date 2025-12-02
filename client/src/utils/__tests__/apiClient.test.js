/**
 * API Client Tests
 */

import { customerApi, businessApi, publicApi } from '../apiClient';
import { customerTokens, businessTokens } from '../tokenManager';

describe('apiClient', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  // ========================================
  // Customer API Tests
  // ========================================
  describe('customerApi', () => {
    beforeEach(() => {
      customerTokens.setTokens('customer-access-token', 'customer-refresh-token');
    });

    describe('get', () => {
      it('should make GET request with Authorization header', async () => {
        global.fetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: 'test' })
        });

        await customerApi.get('/api/test');

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/test',
          expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
              'Authorization': 'Bearer customer-access-token'
            })
          })
        );
      });

      it('should return response from server', async () => {
        global.fetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: 'test' })
        });

        const response = await customerApi.get('/api/test');

        expect(response.ok).toBe(true);
      });
    });

    describe('post', () => {
      it('should make POST request with JSON body', async () => {
        global.fetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true })
        });

        await customerApi.post('/api/test', { name: 'test' });

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/test',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              'Authorization': 'Bearer customer-access-token'
            }),
            body: JSON.stringify({ name: 'test' })
          })
        );
      });
    });

    describe('put', () => {
      it('should make PUT request with JSON body', async () => {
        global.fetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true })
        });

        await customerApi.put('/api/test/1', { name: 'updated' });

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/test/1',
          expect.objectContaining({
            method: 'PUT',
            headers: expect.objectContaining({
              'Content-Type': 'application/json'
            }),
            body: JSON.stringify({ name: 'updated' })
          })
        );
      });
    });

    describe('delete', () => {
      it('should make DELETE request', async () => {
        global.fetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ deleted: true })
        });

        await customerApi.delete('/api/test/1');

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/test/1',
          expect.objectContaining({
            method: 'DELETE',
            headers: expect.objectContaining({
              'Authorization': 'Bearer customer-access-token'
            })
          })
        );
      });
    });

    describe('token refresh', () => {
      it('should refresh token on 401 with TOKEN_EXPIRED code', async () => {
        // First request returns 401 with TOKEN_EXPIRED
        global.fetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ code: 'TOKEN_EXPIRED' })
        });

        // Refresh token request succeeds
        global.fetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token'
          })
        });

        // Retry with new token succeeds
        global.fetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: 'success' })
        });

        const response = await customerApi.get('/api/test');

        expect(response.ok).toBe(true);
        expect(global.fetch).toHaveBeenCalledTimes(3);

        // Verify new token was stored
        expect(customerTokens.getAccessToken()).toBe('new-access-token');
      });

      it('should clear tokens on refresh failure', async () => {
        // First request returns 401 with TOKEN_EXPIRED
        global.fetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ code: 'TOKEN_EXPIRED' })
        });

        // Refresh token request fails
        global.fetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: 'Invalid refresh token' })
        });

        await expect(customerApi.get('/api/test')).rejects.toThrow('Token refresh failed');

        // Tokens should be cleared
        expect(customerTokens.hasTokens()).toBe(false);
      });

      it('should clear tokens on 401 without TOKEN_EXPIRED code', async () => {
        global.fetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: 'Invalid token' })
        });

        await customerApi.get('/api/test');

        expect(customerTokens.hasTokens()).toBe(false);
      });
    });

    describe('error handling', () => {
      it('should throw error when no access token available', async () => {
        customerTokens.clearTokens();

        await expect(customerApi.get('/api/test')).rejects.toThrow('No access token available');
      });
    });
  });

  // ========================================
  // Business API Tests
  // ========================================
  describe('businessApi', () => {
    beforeEach(() => {
      businessTokens.setTokens('business-access-token', 'business-refresh-token');
    });

    describe('get', () => {
      it('should make GET request with business token', async () => {
        global.fetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: 'test' })
        });

        await businessApi.get('/api/business/test');

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/business/test',
          expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
              'Authorization': 'Bearer business-access-token'
            })
          })
        );
      });
    });

    describe('post', () => {
      it('should make POST request with business token', async () => {
        global.fetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true })
        });

        await businessApi.post('/api/business/punch', { username: 'testuser' });

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/business/punch',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': 'Bearer business-access-token',
              'Content-Type': 'application/json'
            })
          })
        );
      });
    });

    describe('token refresh', () => {
      it('should use business refresh endpoint', async () => {
        // First request returns 401 with TOKEN_EXPIRED
        global.fetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ code: 'TOKEN_EXPIRED' })
        });

        // Refresh token request succeeds
        global.fetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            accessToken: 'new-biz-access',
            refreshToken: 'new-biz-refresh'
          })
        });

        // Retry succeeds
        global.fetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: 'success' })
        });

        await businessApi.get('/api/business/test');

        // Verify business refresh endpoint was called
        expect(global.fetch).toHaveBeenNthCalledWith(
          2,
          '/api/business/refresh-token',
          expect.objectContaining({
            method: 'POST'
          })
        );
      });
    });
  });

  // ========================================
  // Public API Tests
  // ========================================
  describe('publicApi', () => {
    describe('get', () => {
      it('should make GET request without Authorization header', async () => {
        global.fetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: 'public' })
        });

        await publicApi.get('/api/public/test');

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/public/test',
          expect.objectContaining({
            method: 'GET'
          })
        );

        // Verify no Authorization header
        const callArgs = global.fetch.mock.calls[0][1];
        expect(callArgs.headers?.Authorization).toBeUndefined();
      });
    });

    describe('post', () => {
      it('should make POST request with JSON body', async () => {
        global.fetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true })
        });

        await publicApi.post('/api/login', { username: 'test', password: 'pass' });

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/login',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json'
            }),
            body: JSON.stringify({ username: 'test', password: 'pass' })
          })
        );
      });
    });

    describe('put', () => {
      it('should make PUT request', async () => {
        global.fetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ updated: true })
        });

        await publicApi.put('/api/public/item/1', { name: 'updated' });

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/public/item/1',
          expect.objectContaining({
            method: 'PUT'
          })
        );
      });
    });

    describe('delete', () => {
      it('should make DELETE request', async () => {
        global.fetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ deleted: true })
        });

        await publicApi.delete('/api/public/item/1');

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/public/item/1',
          expect.objectContaining({
            method: 'DELETE'
          })
        );
      });
    });
  });
});
