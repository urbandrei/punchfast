const { verifyAccessToken } = require('../utils/jwtUtils');

/**
 * Generic authentication middleware
 * Verifies Bearer token and attaches decoded user/business to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function authenticateToken(req, res, next) {
  // Extract token from Authorization header (format: "Bearer <token>")
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      message: 'Access token required',
      code: 'NO_TOKEN'
    });
  }

  try {
    // Verify and decode the token
    const decoded = verifyAccessToken(token);

    // Attach decoded data to request based on type
    if (decoded.type === 'user') {
      req.user = {
        id: decoded.id,
        username: decoded.username,
        isAdmin: decoded.isAdmin || false
      };
    } else if (decoded.type === 'business') {
      req.business = {
        id: decoded.id,
        username: decoded.username,
        storeId: decoded.storeId
      };
    }

    next();
  } catch (error) {
    if (error.code === 'TOKEN_EXPIRED') {
      return res.status(401).json({
        message: 'Access token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    return res.status(403).json({
      message: 'Invalid access token',
      code: 'INVALID_TOKEN'
    });
  }
}

/**
 * Customer/User-specific authentication middleware
 * Ensures the request is from an authenticated customer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function authenticateUser(req, res, next) {
  authenticateToken(req, res, (err) => {
    if (err) {
      return next(err);
    }

    if (!req.user) {
      return res.status(403).json({
        message: 'Customer authentication required',
        code: 'USER_AUTH_REQUIRED'
      });
    }

    next();
  });
}

/**
 * Business-specific authentication middleware
 * Ensures the request is from an authenticated business
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function authenticateBusiness(req, res, next) {
  authenticateToken(req, res, (err) => {
    if (err) {
      return next(err);
    }

    if (!req.business) {
      return res.status(403).json({
        message: 'Business authentication required',
        code: 'BUSINESS_AUTH_REQUIRED'
      });
    }

    next();
  });
}

/**
 * Admin authentication middleware
 * Ensures the request is from an authenticated admin user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function requireAdmin(req, res, next) {
  authenticateUser(req, res, (err) => {
    if (err) {
      return next(err);
    }

    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({
        message: 'Admin access required',
        code: 'ADMIN_REQUIRED'
      });
    }

    next();
  });
}

/**
 * Optional authentication middleware
 * Attaches user/business if token is present, but doesn't require it
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = verifyAccessToken(token);

    if (decoded.type === 'user') {
      req.user = {
        id: decoded.id,
        username: decoded.username,
        isAdmin: decoded.isAdmin || false
      };
    } else if (decoded.type === 'business') {
      req.business = {
        id: decoded.id,
        username: decoded.username,
        storeId: decoded.storeId
      };
    }

    next();
  } catch (error) {
    // Silently ignore invalid/expired tokens for optional auth
    next();
  }
}

module.exports = {
  authenticateToken,
  authenticateUser,
  authenticateBusiness,
  requireAdmin,
  optionalAuth
};
