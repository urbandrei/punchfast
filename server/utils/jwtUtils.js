const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Token expiry times
const ACCESS_TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY = '30d';
const REFRESH_TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

/**
 * Generate an access token (short-lived, 1 hour)
 * @param {Object} payload - User/Business data to encode in token
 * @returns {String} JWT access token
 */
function generateAccessToken(payload) {
  if (!process.env.JWT_ACCESS_SECRET) {
    throw new Error('JWT_ACCESS_SECRET not configured in environment');
  }

  return jwt.sign(
    payload,
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      issuer: 'punchfast-api'
    }
  );
}

/**
 * Generate a refresh token (long-lived, 30 days)
 * @param {Object} payload - User/Business data to encode in token
 * @returns {String} JWT refresh token
 */
function generateRefreshToken(payload) {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET not configured in environment');
  }

  return jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      issuer: 'punchfast-api'
    }
  );
}

/**
 * Verify and decode an access token
 * @param {String} token - JWT access token
 * @returns {Object} Decoded token payload
 * @throws {Error} TOKEN_EXPIRED or INVALID_TOKEN
 */
function verifyAccessToken(token) {
  if (!process.env.JWT_ACCESS_SECRET) {
    throw new Error('JWT_ACCESS_SECRET not configured in environment');
  }

  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      const err = new Error('Access token has expired');
      err.code = 'TOKEN_EXPIRED';
      throw err;
    }
    const err = new Error('Invalid access token');
    err.code = 'INVALID_TOKEN';
    throw err;
  }
}

/**
 * Verify and decode a refresh token
 * @param {String} token - JWT refresh token
 * @returns {Object} Decoded token payload
 * @throws {Error} TOKEN_EXPIRED or INVALID_TOKEN
 */
function verifyRefreshToken(token) {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET not configured in environment');
  }

  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      const err = new Error('Refresh token has expired');
      err.code = 'TOKEN_EXPIRED';
      throw err;
    }
    const err = new Error('Invalid refresh token');
    err.code = 'INVALID_TOKEN';
    throw err;
  }
}

/**
 * Hash a refresh token for storage in database
 * @param {String} token - Plain text refresh token
 * @returns {Promise<String>} Hashed token
 */
async function hashRefreshToken(token) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(token, salt);
}

/**
 * Compare a plain refresh token with a hashed token
 * @param {String} token - Plain text token
 * @param {String} hashedToken - Hashed token from database
 * @returns {Promise<Boolean>} True if tokens match
 */
async function compareRefreshToken(token, hashedToken) {
  return bcrypt.compare(token, hashedToken);
}

/**
 * Calculate refresh token expiry date (30 days from now)
 * @returns {Date} Expiry date
 */
function getRefreshTokenExpiry() {
  return new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
}

/**
 * Extract device info from request for session tracking
 * @param {Object} req - Express request object
 * @returns {Object} Device information
 */
function extractDeviceInfo(req) {
  return {
    userAgent: req.get('user-agent') || 'unknown',
    ip: req.ip || req.connection?.remoteAddress || 'unknown'
  };
}

/**
 * Validate if a refresh token expiry date is still valid
 * @param {Date} expiryDate - Token expiry date from database
 * @returns {Boolean} True if token is still valid
 */
function isRefreshTokenValid(expiryDate) {
  if (!expiryDate) {
    return false;
  }
  return new Date(expiryDate) > new Date();
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashRefreshToken,
  compareRefreshToken,
  getRefreshTokenExpiry,
  extractDeviceInfo,
  isRefreshTokenValid,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY
};
