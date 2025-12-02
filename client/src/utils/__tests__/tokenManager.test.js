/**
 * Token Manager Tests
 */

import { customerTokens, businessTokens, clearAllTokens, hasAnySession } from '../tokenManager';

describe('tokenManager', () => {
  beforeEach(() => {
    // localStorage is automatically cleared by setupTests.js
  });

  describe('customerTokens', () => {
    describe('setTokens', () => {
      it('should store access and refresh tokens', () => {
        customerTokens.setTokens('access-123', 'refresh-456');

        expect(localStorage.getItem('pf_customer_access_token')).toBe('access-123');
        expect(localStorage.getItem('pf_customer_refresh_token')).toBe('refresh-456');
      });
    });

    describe('getAccessToken', () => {
      it('should return access token when it exists', () => {
        customerTokens.setTokens('my-access-token', 'my-refresh-token');

        const token = customerTokens.getAccessToken();

        expect(token).toBe('my-access-token');
      });

      it('should return null when no token exists', () => {
        const token = customerTokens.getAccessToken();

        expect(token).toBeNull();
      });
    });

    describe('getRefreshToken', () => {
      it('should return refresh token when it exists', () => {
        customerTokens.setTokens('my-access-token', 'my-refresh-token');

        const token = customerTokens.getRefreshToken();

        expect(token).toBe('my-refresh-token');
      });

      it('should return null when no token exists', () => {
        const token = customerTokens.getRefreshToken();

        expect(token).toBeNull();
      });
    });

    describe('clearTokens', () => {
      it('should remove both tokens from localStorage', () => {
        customerTokens.setTokens('access', 'refresh');
        customerTokens.clearTokens();

        expect(localStorage.getItem('pf_customer_access_token')).toBeNull();
        expect(localStorage.getItem('pf_customer_refresh_token')).toBeNull();
      });

      it('should result in null tokens after clearing', () => {
        customerTokens.setTokens('access', 'refresh');
        customerTokens.clearTokens();

        expect(customerTokens.getAccessToken()).toBeNull();
        expect(customerTokens.getRefreshToken()).toBeNull();
      });
    });

    describe('hasTokens', () => {
      it('should return true when both tokens exist', () => {
        customerTokens.setTokens('access', 'refresh');

        expect(customerTokens.hasTokens()).toBe(true);
      });

      it('should return false when no tokens exist', () => {
        expect(customerTokens.hasTokens()).toBe(false);
      });

      it('should return false when only access token exists', () => {
        localStorage.setItem('pf_customer_access_token', 'access');

        expect(customerTokens.hasTokens()).toBe(false);
      });

      it('should return false when only refresh token exists', () => {
        localStorage.setItem('pf_customer_refresh_token', 'refresh');

        expect(customerTokens.hasTokens()).toBe(false);
      });
    });
  });

  describe('businessTokens', () => {
    describe('setTokens', () => {
      it('should store access and refresh tokens', () => {
        businessTokens.setTokens('biz-access', 'biz-refresh');

        expect(localStorage.getItem('pf_business_access_token')).toBe('biz-access');
        expect(localStorage.getItem('pf_business_refresh_token')).toBe('biz-refresh');
      });

      it('should clean up legacy keys when setting tokens', () => {
        // Set legacy keys first
        localStorage.setItem('pf_business_username', 'olduser');
        localStorage.setItem('pf_business_email', 'old@email.com');

        businessTokens.setTokens('new-access', 'new-refresh');

        expect(localStorage.getItem('pf_business_username')).toBeNull();
        expect(localStorage.getItem('pf_business_email')).toBeNull();
      });
    });

    describe('getAccessToken', () => {
      it('should return access token when it exists', () => {
        businessTokens.setTokens('biz-access', 'biz-refresh');

        const token = businessTokens.getAccessToken();

        expect(token).toBe('biz-access');
      });

      it('should return null when no token exists', () => {
        const token = businessTokens.getAccessToken();

        expect(token).toBeNull();
      });
    });

    describe('getRefreshToken', () => {
      it('should return refresh token when it exists', () => {
        businessTokens.setTokens('biz-access', 'biz-refresh');

        const token = businessTokens.getRefreshToken();

        expect(token).toBe('biz-refresh');
      });

      it('should return null when no token exists', () => {
        const token = businessTokens.getRefreshToken();

        expect(token).toBeNull();
      });
    });

    describe('clearTokens', () => {
      it('should remove both tokens from localStorage', () => {
        businessTokens.setTokens('access', 'refresh');
        businessTokens.clearTokens();

        expect(localStorage.getItem('pf_business_access_token')).toBeNull();
        expect(localStorage.getItem('pf_business_refresh_token')).toBeNull();
      });

      it('should also clean up legacy keys', () => {
        localStorage.setItem('pf_business_username', 'olduser');
        localStorage.setItem('pf_business_email', 'old@email.com');

        businessTokens.clearTokens();

        expect(localStorage.getItem('pf_business_username')).toBeNull();
        expect(localStorage.getItem('pf_business_email')).toBeNull();
      });
    });

    describe('hasTokens', () => {
      it('should return true when both tokens exist', () => {
        businessTokens.setTokens('access', 'refresh');

        expect(businessTokens.hasTokens()).toBe(true);
      });

      it('should return false when no tokens exist', () => {
        expect(businessTokens.hasTokens()).toBe(false);
      });
    });
  });

  describe('clearAllTokens', () => {
    it('should clear both customer and business tokens', () => {
      customerTokens.setTokens('cust-access', 'cust-refresh');
      businessTokens.setTokens('biz-access', 'biz-refresh');

      clearAllTokens();

      expect(customerTokens.hasTokens()).toBe(false);
      expect(businessTokens.hasTokens()).toBe(false);
    });
  });

  describe('hasAnySession', () => {
    it('should return true if customer has tokens', () => {
      customerTokens.setTokens('access', 'refresh');

      expect(hasAnySession()).toBe(true);
    });

    it('should return true if business has tokens', () => {
      businessTokens.setTokens('access', 'refresh');

      expect(hasAnySession()).toBe(true);
    });

    it('should return true if both have tokens', () => {
      customerTokens.setTokens('cust-access', 'cust-refresh');
      businessTokens.setTokens('biz-access', 'biz-refresh');

      expect(hasAnySession()).toBe(true);
    });

    it('should return false if no tokens exist', () => {
      expect(hasAnySession()).toBe(false);
    });
  });
});
