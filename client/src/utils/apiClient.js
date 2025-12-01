/**
 * API Client - Authenticated fetch with automatic token refresh
 * Provides wrapper functions for making API calls with JWT authentication
 */

import { customerTokens, businessTokens } from './tokenManager';

/**
 * Make an authenticated API request with automatic token refresh
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @param {Object} tokens - Token manager (customerTokens or businessTokens)
 * @param {string} refreshEndpoint - Refresh token endpoint
 * @returns {Promise<Response>} Fetch response
 */
async function authenticatedFetch(url, options = {}, tokens, refreshEndpoint) {
  let accessToken = tokens.getAccessToken();

  if (!accessToken) {
    throw new Error('No access token available');
  }

  // Make initial request with access token
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`
    }
  });

  // If token expired, refresh and retry
  if (response.status === 401) {
    const data = await response.json().catch(() => ({}));

    if (data.code === 'TOKEN_EXPIRED') {
      const refreshToken = tokens.getRefreshToken();

      if (!refreshToken) {
        tokens.clearTokens();
        throw new Error('No refresh token available');
      }

      try {
        // Call refresh endpoint
        const refreshResponse = await fetch(refreshEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ refreshToken })
        });

        if (!refreshResponse.ok) {
          // Refresh failed, clear tokens
          tokens.clearTokens();
          throw new Error('Token refresh failed');
        }

        const refreshData = await refreshResponse.json();

        // Store new tokens
        tokens.setTokens(refreshData.accessToken, refreshData.refreshToken);

        // Retry original request with new access token
        response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${refreshData.accessToken}`
          }
        });
      } catch (error) {
        // Refresh failed, clear tokens
        tokens.clearTokens();
        throw error;
      }
    } else {
      // Other 401 error (invalid token, etc.)
      tokens.clearTokens();
    }
  }

  return response;
}

/**
 * Customer API client with automatic token refresh
 */
export const customerApi = {
  /**
   * GET request
   * @param {string} url - API endpoint
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Response>}
   */
  get(url, options = {}) {
    return authenticatedFetch(
      url,
      { ...options, method: 'GET' },
      customerTokens,
      '/api/refresh-token'
    );
  },

  /**
   * POST request
   * @param {string} url - API endpoint
   * @param {Object} body - Request body
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Response>}
   */
  post(url, body = {}, options = {}) {
    return authenticatedFetch(
      url,
      {
        ...options,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: JSON.stringify(body)
      },
      customerTokens,
      '/api/refresh-token'
    );
  },

  /**
   * PUT request
   * @param {string} url - API endpoint
   * @param {Object} body - Request body
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Response>}
   */
  put(url, body = {}, options = {}) {
    return authenticatedFetch(
      url,
      {
        ...options,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: JSON.stringify(body)
      },
      customerTokens,
      '/api/refresh-token'
    );
  },

  /**
   * DELETE request
   * @param {string} url - API endpoint
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Response>}
   */
  delete(url, options = {}) {
    return authenticatedFetch(
      url,
      { ...options, method: 'DELETE' },
      customerTokens,
      '/api/refresh-token'
    );
  }
};

/**
 * Business API client with automatic token refresh
 */
export const businessApi = {
  /**
   * GET request
   * @param {string} url - API endpoint
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Response>}
   */
  get(url, options = {}) {
    return authenticatedFetch(
      url,
      { ...options, method: 'GET' },
      businessTokens,
      '/api/business/refresh-token'
    );
  },

  /**
   * POST request
   * @param {string} url - API endpoint
   * @param {Object} body - Request body
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Response>}
   */
  post(url, body = {}, options = {}) {
    return authenticatedFetch(
      url,
      {
        ...options,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: JSON.stringify(body)
      },
      businessTokens,
      '/api/business/refresh-token'
    );
  },

  /**
   * PUT request
   * @param {string} url - API endpoint
   * @param {Object} body - Request body
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Response>}
   */
  put(url, body = {}, options = {}) {
    return authenticatedFetch(
      url,
      {
        ...options,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: JSON.stringify(body)
      },
      businessTokens,
      '/api/business/refresh-token'
    );
  },

  /**
   * DELETE request
   * @param {string} url - API endpoint
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Response>}
   */
  delete(url, options = {}) {
    return authenticatedFetch(
      url,
      { ...options, method: 'DELETE' },
      businessTokens,
      '/api/business/refresh-token'
    );
  }
};

/**
 * Public API client (no authentication)
 */
export const publicApi = {
  /**
   * GET request
   * @param {string} url - API endpoint
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Response>}
   */
  get(url, options = {}) {
    return fetch(url, { ...options, method: 'GET' });
  },

  /**
   * POST request
   * @param {string} url - API endpoint
   * @param {Object} body - Request body
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Response>}
   */
  post(url, body = {}, options = {}) {
    return fetch(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(body)
    });
  },

  /**
   * PUT request
   * @param {string} url - API endpoint
   * @param {Object} body - Request body
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Response>}
   */
  put(url, body = {}, options = {}) {
    return fetch(url, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(body)
    });
  },

  /**
   * DELETE request
   * @param {string} url - API endpoint
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Response>}
   */
  delete(url, options = {}) {
    return fetch(url, { ...options, method: 'DELETE' });
  }
};
