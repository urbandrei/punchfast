/**
 * Token Manager - Handles JWT token storage in localStorage
 * Provides separate management for customer and business tokens
 */

// Storage keys
const CUSTOMER_ACCESS_TOKEN_KEY = 'pf_customer_access_token';
const CUSTOMER_REFRESH_TOKEN_KEY = 'pf_customer_refresh_token';
const BUSINESS_ACCESS_TOKEN_KEY = 'pf_business_access_token';
const BUSINESS_REFRESH_TOKEN_KEY = 'pf_business_refresh_token';

// Legacy keys to clean up
const LEGACY_BUSINESS_USERNAME_KEY = 'pf_business_username';
const LEGACY_BUSINESS_EMAIL_KEY = 'pf_business_email';

/**
 * Customer token management
 */
export const customerTokens = {
  /**
   * Get the customer access token
   * @returns {string|null} Access token or null
   */
  getAccessToken() {
    try {
      return localStorage.getItem(CUSTOMER_ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Error reading customer access token:', error);
      return null;
    }
  },

  /**
   * Get the customer refresh token
   * @returns {string|null} Refresh token or null
   */
  getRefreshToken() {
    try {
      return localStorage.getItem(CUSTOMER_REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error reading customer refresh token:', error);
      return null;
    }
  },

  /**
   * Store customer tokens
   * @param {string} accessToken - JWT access token
   * @param {string} refreshToken - JWT refresh token
   */
  setTokens(accessToken, refreshToken) {
    try {
      localStorage.setItem(CUSTOMER_ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(CUSTOMER_REFRESH_TOKEN_KEY, refreshToken);
    } catch (error) {
      console.error('Error storing customer tokens:', error);
    }
  },

  /**
   * Clear customer tokens from localStorage
   */
  clearTokens() {
    try {
      localStorage.removeItem(CUSTOMER_ACCESS_TOKEN_KEY);
      localStorage.removeItem(CUSTOMER_REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error clearing customer tokens:', error);
    }
  },

  /**
   * Check if customer has tokens
   * @returns {boolean} True if both tokens exist
   */
  hasTokens() {
    return !!(this.getAccessToken() && this.getRefreshToken());
  }
};

/**
 * Business token management
 */
export const businessTokens = {
  /**
   * Get the business access token
   * @returns {string|null} Access token or null
   */
  getAccessToken() {
    try {
      return localStorage.getItem(BUSINESS_ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Error reading business access token:', error);
      return null;
    }
  },

  /**
   * Get the business refresh token
   * @returns {string|null} Refresh token or null
   */
  getRefreshToken() {
    try {
      return localStorage.getItem(BUSINESS_REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error reading business refresh token:', error);
      return null;
    }
  },

  /**
   * Store business tokens and clean up legacy keys
   * @param {string} accessToken - JWT access token
   * @param {string} refreshToken - JWT refresh token
   */
  setTokens(accessToken, refreshToken) {
    try {
      localStorage.setItem(BUSINESS_ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(BUSINESS_REFRESH_TOKEN_KEY, refreshToken);

      // Clean up legacy keys
      localStorage.removeItem(LEGACY_BUSINESS_USERNAME_KEY);
      localStorage.removeItem(LEGACY_BUSINESS_EMAIL_KEY);
    } catch (error) {
      console.error('Error storing business tokens:', error);
    }
  },

  /**
   * Clear business tokens from localStorage
   */
  clearTokens() {
    try {
      localStorage.removeItem(BUSINESS_ACCESS_TOKEN_KEY);
      localStorage.removeItem(BUSINESS_REFRESH_TOKEN_KEY);

      // Also clean up legacy keys
      localStorage.removeItem(LEGACY_BUSINESS_USERNAME_KEY);
      localStorage.removeItem(LEGACY_BUSINESS_EMAIL_KEY);
    } catch (error) {
      console.error('Error clearing business tokens:', error);
    }
  },

  /**
   * Check if business has tokens
   * @returns {boolean} True if both tokens exist
   */
  hasTokens() {
    return !!(this.getAccessToken() && this.getRefreshToken());
  }
};

/**
 * Clear all tokens (customer and business)
 */
export function clearAllTokens() {
  customerTokens.clearTokens();
  businessTokens.clearTokens();
}

/**
 * Check if any session exists
 * @returns {boolean} True if customer or business has tokens
 */
export function hasAnySession() {
  return customerTokens.hasTokens() || businessTokens.hasTokens();
}
