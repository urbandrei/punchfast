'use strict';

const { Op } = require('sequelize');
const Business = require('../models/business');

// POST /api/business/signup
exports.signup = async (req, res) => {
  try {
    const { legalName, email, phone, address, password, confirmPassword } = req.body;

    if (!legalName || !email || !phone || !address || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    if (confirmPassword && confirmPassword !== password) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const normEmail = String(email).trim().toLowerCase();
    const existing = await Business.findOne({ where: { email: normEmail } });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    await Business.create({
      legalName,
      email: normEmail,
      phone,
      address,
      password,           // virtual; hashes into passwordHash via model setter
      status: 'pending',
    });

    return res.status(201).json({ message: 'Sign up successful!' });
  } catch (e) {
    console.error('business signup error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/business/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normEmail = String(email || '').trim().toLowerCase();

    const business = await Business.findOne({ where: { email: normEmail } });
    if (!business) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    if (business.status !== 'approved') {
      return res.status(403).json({ message: 'Your application is pending approval.' });
    }

    const ok = await business.checkPassword(password || '');
    if (!ok) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    return res.json({ message: 'Login successful!' });
  } catch (e) {
    console.error('business login error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/admin/businesses?status=pending&limit=50&offset=0&q=search
exports.listBusinesses = async (req, res) => {
  try {
    const { status = '', limit = 50, offset = 0, q = '' } = req.query;

    const where = {};
    if (status) where.status = status;
    if (q) {
      where[Op.or] = [
        { email: { [Op.iLike]: `%${q}%` } },
        { legalName: { [Op.iLike]: `%${q}%` } },
      ];
    }

    const result = await Business.findAndCountAll({
      where,
      attributes: ['id', 'legalName', 'email', 'status'],
      order: [['id', 'ASC']],
      limit: Math.min(Number(limit) || 50, 200),
      offset: Number(offset) || 0,
    });

    return res.json({ count: result.count, rows: result.rows });
  } catch (e) {
    console.error('listBusinesses error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/admin/businesses/:id/approve
exports.approve = async (req, res) => {
  try {
    const { id } = req.params;
    const biz = await Business.findByPk(id);
    if (!biz) return res.status(404).json({ message: 'Not found' });

    await biz.update({ status: 'approved' });
    return res.json({ message: 'Business approved.' });
  } catch (e) {
    console.error('approve error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};
