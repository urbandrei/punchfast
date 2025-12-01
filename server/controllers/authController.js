const User = require('../models/user');
const Business = require('../models/business');
const bcrypt = require('bcryptjs');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashRefreshToken,
  compareRefreshToken,
  getRefreshTokenExpiry,
  extractDeviceInfo,
  isRefreshTokenValid
} = require('../utils/jwtUtils');

// --- helper to normalize usernames/usernames/emails ---
function normalizeName(value) {
  return String(value || '').trim().toLowerCase();
}

/**
 * Customer login - Returns JWT tokens
 */
exports.login = async (req, res) => {
  const rawUsername = req.body?.username;
  const username = normalizeName(rawUsername);

  try {
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(400).json({ message: 'Invalid credentials.' });

    const isMatch = await bcrypt.compare(req.body.password || '', user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials.' });

    // Generate JWT tokens
    const accessToken = generateAccessToken({
      id: user.id,
      username: user.username,
      type: 'user',
      isAdmin: user.isAdmin || false
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      username: user.username,
      type: 'user'
    });

    // Hash and store refresh token in database
    const hashedRefreshToken = await hashRefreshToken(refreshToken);
    const deviceInfo = extractDeviceInfo(req);

    await user.update({
      refreshToken: hashedRefreshToken,
      refreshTokenCreatedAt: new Date(),
      refreshTokenExpiresAt: getRefreshTokenExpiry(),
      deviceInfo: deviceInfo,
      lastLoginIp: deviceInfo.ip
    });

    return res.status(200).json({
      message: 'Login successful!',
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin || false
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Customer signup - Returns JWT tokens
 */
exports.signup = async (req, res) => {
  const rawUsername = req.body?.username;
  const username = normalizeName(rawUsername);
  const password = req.body?.password || '';

  try {
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) return res.status(400).json({ message: 'Username already in use.' });

    const newUser = await User.create({ username, password });

    // Generate JWT tokens immediately upon signup
    const accessToken = generateAccessToken({
      id: newUser.id,
      username: newUser.username,
      type: 'user',
      isAdmin: newUser.isAdmin || false
    });

    const refreshToken = generateRefreshToken({
      id: newUser.id,
      username: newUser.username,
      type: 'user'
    });

    // Hash and store refresh token
    const hashedRefreshToken = await hashRefreshToken(refreshToken);
    const deviceInfo = extractDeviceInfo(req);

    await newUser.update({
      refreshToken: hashedRefreshToken,
      refreshTokenCreatedAt: new Date(),
      refreshTokenExpiresAt: getRefreshTokenExpiry(),
      deviceInfo: deviceInfo,
      lastLoginIp: deviceInfo.ip
    });

    return res.status(201).json({
      message: 'Signup successful!',
      user: {
        id: newUser.id,
        username: newUser.username,
        isAdmin: newUser.isAdmin || false
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Refresh user token - Implements token rotation
 */
exports.refreshUserToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token required' });
  }

  try {
    // Verify JWT signature
    const decoded = verifyRefreshToken(refreshToken);

    if (decoded.type !== 'user') {
      return res.status(403).json({ message: 'Invalid token type' });
    }

    // Find user and verify token in database
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify token hasn't been revoked
    if (!user.refreshToken) {
      return res.status(403).json({ message: 'Refresh token has been revoked' });
    }

    // Compare hashed tokens
    const isValidToken = await compareRefreshToken(refreshToken, user.refreshToken);
    if (!isValidToken) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    // Check database expiry
    if (!isRefreshTokenValid(user.refreshTokenExpiresAt)) {
      return res.status(403).json({ message: 'Refresh token has expired' });
    }

    // TOKEN ROTATION: Generate new tokens
    const newAccessToken = generateAccessToken({
      id: user.id,
      username: user.username,
      type: 'user',
      isAdmin: user.isAdmin || false
    });

    const newRefreshToken = generateRefreshToken({
      id: user.id,
      username: user.username,
      type: 'user'
    });

    // Store new hashed refresh token (invalidates old one)
    const hashedRefreshToken = await hashRefreshToken(newRefreshToken);
    await user.update({
      refreshToken: hashedRefreshToken,
      refreshTokenCreatedAt: new Date(),
      refreshTokenExpiresAt: getRefreshTokenExpiry()
    });

    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    if (error.code === 'TOKEN_EXPIRED') {
      return res.status(403).json({ message: 'Refresh token has expired' });
    }
    if (error.code === 'INVALID_TOKEN') {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }
    console.error('Refresh token error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Customer logout - Requires JWT authentication
 */
exports.logout = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ message: 'User ID required' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Clear refresh token from database
    await user.update({
      refreshToken: null,
      refreshTokenCreatedAt: null,
      refreshTokenExpiresAt: null
    });

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get customer session info - Requires JWT authentication
 */
exports.getSession = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ message: 'User ID required' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      session: {
        userId: user.id,
        username: user.username,
        isAdmin: user.isAdmin || false,
        deviceInfo: user.deviceInfo || {},
        lastLoginIp: user.lastLoginIp,
        refreshTokenCreatedAt: user.refreshTokenCreatedAt,
        refreshTokenExpiresAt: user.refreshTokenExpiresAt,
        isActive: isRefreshTokenValid(user.refreshTokenExpiresAt)
      }
    });
  } catch (error) {
    console.error('Get session error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Customer change password - Requires JWT authentication, invalidates tokens
 */
exports.changePassword = async (req, res) => {
  const userId = req.user?.id;
  const { currentPassword, newPassword } = req.body || {};

  if (!userId || !currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect.' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and invalidate refresh token (forces re-login)
    await user.update({
      password: hashedPassword,
      refreshToken: null,
      refreshTokenCreatedAt: null,
      refreshTokenExpiresAt: null
    });

    return res.status(200).json({ message: 'Password changed successfully!' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Business signup (pending by default) - No tokens until approved
 */
exports.businessSignup = async (req, res) => {
  const rawUsername = req.body?.username;
  const username = normalizeName(rawUsername);
  const password = req.body?.password || '';

  try {
    const existingBusiness = await Business.findOne({ where: { username } });
    if (existingBusiness) {
      return res.status(400).json({ message: 'Username already in use.' });
    }

    const newBusiness = await Business.create({
      username,
      password,
      status: 'pending',
      goal: 10
    });

    return res.status(201).json({
      message: 'Application submitted. Pending approval.',
      business: {
        id: newBusiness.id,
        username: newBusiness.username,
        status: newBusiness.status
      }
    });
  } catch (error) {
    console.error('Business signup error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Business login - Returns JWT tokens (must be approved)
 */
exports.businessLogin = async (req, res) => {
  const rawUsername = req.body?.username;
  const username = normalizeName(rawUsername);
  const password = req.body?.password || '';

  try {
    const business = await Business.findOne({ where: { username } });
    if (!business) return res.status(400).json({ message: 'Invalid credentials.' });

    const isMatch = await bcrypt.compare(password, business.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials.' });

    if (business.status !== 'approved') {
      return res.status(403).json({ message: 'Your application is pending approval.' });
    }

    // Generate JWT tokens
    const accessToken = generateAccessToken({
      id: business.id,
      username: business.username,
      type: 'business',
      storeId: business.storeId
    });

    const refreshToken = generateRefreshToken({
      id: business.id,
      username: business.username,
      type: 'business'
    });

    // Hash and store refresh token
    const hashedRefreshToken = await hashRefreshToken(refreshToken);
    const deviceInfo = extractDeviceInfo(req);

    await business.update({
      refreshToken: hashedRefreshToken,
      refreshTokenCreatedAt: new Date(),
      refreshTokenExpiresAt: getRefreshTokenExpiry(),
      deviceInfo: deviceInfo,
      lastLoginIp: deviceInfo.ip
    });

    return res.status(200).json({
      message: 'Login successful!',
      business: {
        id: business.id,
        username: business.username,
        goal: business.goal,
        storeId: business.storeId
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Business login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Refresh business token - Implements token rotation
 */
exports.refreshBusinessToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token required' });
  }

  try {
    // Verify JWT signature
    const decoded = verifyRefreshToken(refreshToken);

    if (decoded.type !== 'business') {
      return res.status(403).json({ message: 'Invalid token type' });
    }

    // Find business and verify token in database
    const business = await Business.findByPk(decoded.id);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Verify token hasn't been revoked
    if (!business.refreshToken) {
      return res.status(403).json({ message: 'Refresh token has been revoked' });
    }

    // Compare hashed tokens
    const isValidToken = await compareRefreshToken(refreshToken, business.refreshToken);
    if (!isValidToken) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    // Check database expiry
    if (!isRefreshTokenValid(business.refreshTokenExpiresAt)) {
      return res.status(403).json({ message: 'Refresh token has expired' });
    }

    // TOKEN ROTATION: Generate new tokens
    const newAccessToken = generateAccessToken({
      id: business.id,
      username: business.username,
      type: 'business',
      storeId: business.storeId
    });

    const newRefreshToken = generateRefreshToken({
      id: business.id,
      username: business.username,
      type: 'business'
    });

    // Store new hashed refresh token (invalidates old one)
    const hashedRefreshToken = await hashRefreshToken(newRefreshToken);
    await business.update({
      refreshToken: hashedRefreshToken,
      refreshTokenCreatedAt: new Date(),
      refreshTokenExpiresAt: getRefreshTokenExpiry()
    });

    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    if (error.code === 'TOKEN_EXPIRED') {
      return res.status(403).json({ message: 'Refresh token has expired' });
    }
    if (error.code === 'INVALID_TOKEN') {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }
    console.error('Refresh business token error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Business logout - Requires JWT authentication
 */
exports.businessLogout = async (req, res) => {
  try {
    const businessId = req.business?.id;

    if (!businessId) {
      return res.status(400).json({ message: 'Business ID required' });
    }

    const business = await Business.findByPk(businessId);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Clear refresh token from database
    await business.update({
      refreshToken: null,
      refreshTokenCreatedAt: null,
      refreshTokenExpiresAt: null
    });

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Business logout error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get business session info - Requires JWT authentication
 */
exports.getBusinessSession = async (req, res) => {
  try {
    const businessId = req.business?.id;

    if (!businessId) {
      return res.status(400).json({ message: 'Business ID required' });
    }

    const business = await Business.findByPk(businessId);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    return res.status(200).json({
      session: {
        businessId: business.id,
        username: business.username,
        storeId: business.storeId,
        deviceInfo: business.deviceInfo || {},
        lastLoginIp: business.lastLoginIp,
        refreshTokenCreatedAt: business.refreshTokenCreatedAt,
        refreshTokenExpiresAt: business.refreshTokenExpiresAt,
        isActive: isRefreshTokenValid(business.refreshTokenExpiresAt)
      }
    });
  } catch (error) {
    console.error('Get business session error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/approve-business
 * header: x-admin-token: ADMIN_TOKEN
 */
exports.approveBusiness = async (req, res) => {
  try {
    const token = req.headers['x-admin-token'] || '';
    if (token !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const rawUsername = req.body?.username;
    const username = normalizeName(rawUsername);
    if (!username) return res.status(400).json({ message: 'Missing username' });

    const biz = await Business.findOne({ where: { username } });
    if (!biz) return res.status(404).json({ message: 'Business not found' });

    biz.status = 'approved';
    await biz.save();

    return res.json({ message: 'Approved', username: biz.username });
  } catch (e) {
    console.error('approveBusiness error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/business-offer?username=...
 */
exports.getBusinessOffer = async (req, res) => {
  try {
    const rawUsername = req.query?.username;
    const username = normalizeName(rawUsername);
    const biz = await Business.findOne({ where: { username } });

    if (!biz) return res.status(404).json({ message: 'Business not found' });

    return res.json({ goal: biz.goal });
  } catch (e) {
    console.error('getBusinessOffer error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * PUT /api/business-offer  { username, goal? }
 */
exports.updateBusinessOffer = async (req, res) => {
  try {
    const rawUsername = req.body?.username;
    const username = normalizeName(rawUsername);
    const { goal } = req.body || {};

    const biz = await Business.findOne({ where: { username } });
    if (!biz) return res.status(404).json({ message: 'Business not found' });

    if (goal !== undefined) {
      biz.goal = Math.max(1, parseInt(goal, 10) || 10);
    }

    await biz.save();

    return res.json({
      message: 'Offer updated',
      goal: biz.goal
    });
  } catch (e) {
    console.error('updateBusinessOffer error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};
