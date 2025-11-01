const { Op } = require('sequelize');
const Business = require('../models/business');

exports.signup = async (req, res) => {
  try {
    const { legalName, email, phone, address, password, confirmPassword } = req.body;

    if (!legalName || !email || !phone || !address || !password)
      return res.status(400).json({ message: 'Missing required fields' });
    if (confirmPassword && confirmPassword !== password)
      return res.status(400).json({ message: 'Passwords do not match' });

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await Business.findOne({ where: { email: normalizedEmail } });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    await Business.create({
      legalName,
      email: normalizedEmail,
      phone,
      address,
      password, // hashes into passwordHash
      status: 'pending',
    });

    return res.status(201).json({ message: 'Sign up successful!' });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email).trim().toLowerCase();

    const business = await Business.findOne({ where: { email: normalizedEmail } });
    if (!business) return res.status(400).json({ message: 'Invalid email or password' });

    if (business.status !== 'approved')
      return res.status(403).json({ message: 'Your application is pending approval.' });

    const ok = await business.checkPassword(password);
    if (!ok) return res.status(400).json({ message: 'Invalid email or password' });

    return res.json({ message: 'Login successful!' });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.approve = async (req, res) => {
  try {
    const { id } = req.params;
    const biz = await Business.findByPk(id);
    if (!biz) return res.status(404).json({ message: 'Not found' });

    if (biz.status === 'approved') {
      return res.json({ message: 'Already approved.' });
    }

    await biz.update({ status: 'approved' });
    return res.json({ message: 'Business approved.' });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
};

//list businesses (pending)
exports.list = async (req, res) => {
  try {
    const rawStatus = (req.query.status || 'pending').toLowerCase();
    const status = ['pending', 'approved', 'all'].includes(rawStatus) ? rawStatus : 'pending';
    const limit  = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = parseInt(req.query.offset, 10) || 0;
    const q = (req.query.q || '').trim();

    const where = {};
    if (status !== 'all') where.status = status;
    if (q) {
      where[Op.or] = [
        { legalName: { [Op.iLike]: `%${q}%` } },
        { email:     { [Op.iLike]: `%${q}%` } },
        { phone:     { [Op.iLike]: `%${q}%` } },
        { address:   { [Op.iLike]: `%${q}%` } },
      ];
    }

    const { rows, count } = await Business.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'legalName', 'email', 'phone', 'address', 'status', 'createdAt'],
      limit,
      offset,
    });

    return res.json({ total: count, limit, offset, businesses: rows });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
};
