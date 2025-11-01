const Business = require('../models/business');

exports.signup = async (req, res) => {
  try {
    const { legalName, email, phone, address, password, confirmPassword } = req.body;

    if (!legalName || !email || !phone || !address || !password)
      return res.status(400).json({ message: 'Missing required fields' });
    if (confirmPassword && confirmPassword !== password)
      return res.status(400).json({ message: 'Passwords do not match' });

    const existing = await Business.findOne({ where: { email: String(email).trim().toLowerCase() } });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    await Business.create({
      legalName,
      email: String(email).trim().toLowerCase(),
      phone,
      address,
      password,              // virtual — hashes into passwordHash
      status: 'pending'
    });

    return res.status(201).json({ message: 'Sign up successful!' });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const business = await Business.findOne({ where: { email: String(email).trim().toLowerCase() } });
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
    await biz.update({ status: 'approved' });
    return res.json({ message: 'Business approved.' });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
};
