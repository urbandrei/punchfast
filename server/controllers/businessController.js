const { Op } = require('sequelize');
const Business = require('../models/business');

/**
 * POST /api/business/signup
 */
exports.signup = async (req, res) => {
  try {
    const { legalName, email, phone, address, password, confirmPassword } = req.body;

    // Basic validation
    if (!legalName || !email || !phone || !address || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    if (confirmPassword && confirmPassword !== password) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Uniqueness check
    const existing = await Business.findOne({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Create as "pending". Virtual "password" setter will populate passwordHash.
    const newBiz = await Business.create({
      legalName,
      email: normalizedEmail,
      phone,
      address,
      password,
      status: 'pending',
    });

    return res.status(201).json({
      message: 'Sign up successful!',
      id: newBiz.id, // useful for admin approval during testing
    });
  } catch (e) {
    console.error('[business/signup] error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/business/login
 */
exports.login = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    const business = await Business.findOne({ where: { email } });

    // Generic invalid response if not found or bad/legacy hash
    if (!business || !business.passwordHash) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    if (business.status !== 'approved') {
      return res.status(403).json({ message: 'Your application is pending approval.' });
    }

    const ok = await business.checkPassword(password);
    if (!ok) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    return res.json({ message: 'Login successful!' });
  } catch (e) {
    console.error('[business/login] error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/admin/businesses/:id/approve
 */
exports.approve = async (req, res) => {
  try {
    const { id } = req.params;
    const biz = await Business.findByPk(id);
    if (!biz) {
      return res.status(404).json({ message: 'Not found' });
    }

    if (biz.status === 'approved') {
      return res.json({ message: 'Already approved', id: biz.id });
    }

    await biz.update({ status: 'approved' });
    return res.json({ message: 'Business approved.', id: biz.id });
  } catch (e) {
    console.error('[business/approve] error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/admin/businesses?status=pending|approved&limit=50&offset=0
 */
exports.list = async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    const where = {};
    if (status && ['pending', 'approved'].includes(status)) {
      where.status = status;
    }

    const rows = await Business.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: Math.min(Number(limit) || 50, 200),
      offset: Number(offset) || 0,
      attributes: [
        'id',
        'legalName',
        'email',
        'phone',
        'address',
        'status',
        'createdAt',
      ],
    });

    return res.json({ businesses: rows });
  } catch (e) {
    console.error('[business/list] error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};
