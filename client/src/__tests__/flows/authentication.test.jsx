/**
 * Authentication Flow Integration Tests
 *
 * Tests the complete authentication flow including:
 * - Customer login/signup
 * - Business login/signup
 * - Session restoration from localStorage
 * - Logout
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { customerTokens, businessTokens } from '../../utils/tokenManager';

// Mock the UnifiedAuthModal component for integration testing
jest.mock('react-router-dom');

describe('Authentication Flows', () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Customer Login Flow', () => {
    it('should store tokens on successful login', async () => {
      const mockResponse = {
        user: { id: 1, username: 'testuser' },
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      // Simulate login API call
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testuser', password: 'password123' })
      });

      const data = await response.json();

      // Store tokens as the component would
      customerTokens.setTokens(data.accessToken, data.refreshToken);

      // Verify tokens are stored
      expect(customerTokens.getAccessToken()).toBe('test-access-token');
      expect(customerTokens.getRefreshToken()).toBe('test-refresh-token');
      expect(customerTokens.hasTokens()).toBe(true);
    });

    it('should handle login failure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Invalid credentials' })
      });

      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testuser', password: 'wrongpassword' })
      });

      expect(response.ok).toBe(false);
      const data = await response.json();
      expect(data.message).toBe('Invalid credentials');
    });
  });

  describe('Customer Signup Flow', () => {
    it('should create account and store tokens', async () => {
      const mockResponse = {
        user: { id: 2, username: 'newuser' },
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'newuser', password: 'password123' })
      });

      const data = await response.json();
      customerTokens.setTokens(data.accessToken, data.refreshToken);

      expect(customerTokens.getAccessToken()).toBe('new-access-token');
      expect(data.user.username).toBe('newuser');
    });

    it('should handle duplicate username error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Username already exists' })
      });

      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'existinguser', password: 'password123' })
      });

      expect(response.ok).toBe(false);
      const data = await response.json();
      expect(data.message).toBe('Username already exists');
    });
  });

  describe('Business Login Flow', () => {
    it('should store business tokens on successful login', async () => {
      const mockResponse = {
        business: { id: 1, username: 'testbiz' },
        accessToken: 'biz-access-token',
        refreshToken: 'biz-refresh-token'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const response = await fetch('/api/business/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testbiz', password: 'bizpass123' })
      });

      const data = await response.json();
      businessTokens.setTokens(data.accessToken, data.refreshToken);

      expect(businessTokens.getAccessToken()).toBe('biz-access-token');
      expect(businessTokens.getRefreshToken()).toBe('biz-refresh-token');
      expect(businessTokens.hasTokens()).toBe(true);
    });

    it('should keep customer and business sessions separate', async () => {
      // Set customer tokens
      customerTokens.setTokens('customer-access', 'customer-refresh');

      // Set business tokens
      businessTokens.setTokens('business-access', 'business-refresh');

      // Both should be accessible independently
      expect(customerTokens.getAccessToken()).toBe('customer-access');
      expect(businessTokens.getAccessToken()).toBe('business-access');

      // Clearing one should not affect the other
      customerTokens.clearTokens();
      expect(customerTokens.hasTokens()).toBe(false);
      expect(businessTokens.hasTokens()).toBe(true);
    });
  });

  describe('Business Signup Flow', () => {
    it('should show pending approval message for business signup', async () => {
      const mockResponse = {
        message: 'Application submitted. Your business is pending approval.'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const response = await fetch('/api/business/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'newbiz',
          legalName: 'New Business LLC',
          email: 'biz@example.com',
          phone: '555-1234',
          address: '123 Main St',
          password: 'bizpass123'
        })
      });

      const data = await response.json();
      expect(data.message).toContain('pending approval');
    });
  });

  describe('Session Restoration', () => {
    it('should restore customer session from localStorage', () => {
      // Pre-populate localStorage as if user was previously logged in
      localStorage.setItem('pf_customer_access_token', 'stored-access');
      localStorage.setItem('pf_customer_refresh_token', 'stored-refresh');

      // Check tokens are accessible
      expect(customerTokens.getAccessToken()).toBe('stored-access');
      expect(customerTokens.getRefreshToken()).toBe('stored-refresh');
      expect(customerTokens.hasTokens()).toBe(true);
    });

    it('should restore business session from localStorage', () => {
      localStorage.setItem('pf_business_access_token', 'biz-stored-access');
      localStorage.setItem('pf_business_refresh_token', 'biz-stored-refresh');

      expect(businessTokens.getAccessToken()).toBe('biz-stored-access');
      expect(businessTokens.getRefreshToken()).toBe('biz-stored-refresh');
      expect(businessTokens.hasTokens()).toBe(true);
    });

    it('should return null when no session exists', () => {
      expect(customerTokens.getAccessToken()).toBeNull();
      expect(customerTokens.hasTokens()).toBe(false);
    });
  });

  describe('Logout Flow', () => {
    it('should clear customer tokens on logout', () => {
      customerTokens.setTokens('access', 'refresh');
      expect(customerTokens.hasTokens()).toBe(true);

      customerTokens.clearTokens();

      expect(customerTokens.getAccessToken()).toBeNull();
      expect(customerTokens.getRefreshToken()).toBeNull();
      expect(customerTokens.hasTokens()).toBe(false);
    });

    it('should clear business tokens on logout', () => {
      businessTokens.setTokens('biz-access', 'biz-refresh');
      expect(businessTokens.hasTokens()).toBe(true);

      businessTokens.clearTokens();

      expect(businessTokens.getAccessToken()).toBeNull();
      expect(businessTokens.getRefreshToken()).toBeNull();
      expect(businessTokens.hasTokens()).toBe(false);
    });

    it('should clear all sessions with clearAllTokens', () => {
      customerTokens.setTokens('customer-access', 'customer-refresh');
      businessTokens.setTokens('business-access', 'business-refresh');

      // Import and use clearAllTokens
      const { clearAllTokens } = require('../../utils/tokenManager');
      clearAllTokens();

      expect(customerTokens.hasTokens()).toBe(false);
      expect(businessTokens.hasTokens()).toBe(false);
    });
  });

  describe('Token Refresh Flow', () => {
    it('should refresh token on 401 response', async () => {
      // First call returns 401
      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401
        })
        // Refresh token call succeeds
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token'
          })
        })
        // Retry original call succeeds
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: 'success' })
        });

      customerTokens.setTokens('old-access', 'old-refresh');

      // Simulate apiClient behavior
      let response = await fetch('/api/protected', {
        headers: { Authorization: `Bearer ${customerTokens.getAccessToken()}` }
      });

      if (response.status === 401) {
        // Refresh token
        const refreshResponse = await fetch('/api/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: customerTokens.getRefreshToken() })
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          customerTokens.setTokens(data.accessToken, data.refreshToken);

          // Retry original request
          response = await fetch('/api/protected', {
            headers: { Authorization: `Bearer ${customerTokens.getAccessToken()}` }
          });
        }
      }

      expect(response.ok).toBe(true);
      expect(customerTokens.getAccessToken()).toBe('new-access-token');
    });

    it('should clear tokens when refresh fails', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: 'Invalid refresh token' })
        });

      customerTokens.setTokens('old-access', 'old-refresh');

      const response = await fetch('/api/protected');

      if (response.status === 401) {
        const refreshResponse = await fetch('/api/refresh', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: customerTokens.getRefreshToken() })
        });

        if (!refreshResponse.ok) {
          customerTokens.clearTokens();
        }
      }

      expect(customerTokens.hasTokens()).toBe(false);
    });
  });

  describe('hasAnySession', () => {
    it('should return true when customer is logged in', () => {
      customerTokens.setTokens('access', 'refresh');

      const { hasAnySession } = require('../../utils/tokenManager');
      expect(hasAnySession()).toBe(true);
    });

    it('should return true when business is logged in', () => {
      businessTokens.setTokens('access', 'refresh');

      const { hasAnySession } = require('../../utils/tokenManager');
      expect(hasAnySession()).toBe(true);
    });

    it('should return false when no one is logged in', () => {
      const { hasAnySession } = require('../../utils/tokenManager');
      expect(hasAnySession()).toBe(false);
    });
  });
});
