const User = require('../models/user');
const Business = require('../models/business');
const bcrypt = require('bcryptjs');


exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(400).json({ message: 'Invalid credentials.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials.' });

    return res.status(200).json({ message: 'Login successful!', user: { id: user.id, username: user.username } });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.signup = async (req, res) => {
  const { username, password } = req.body;
  try {
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) return res.status(400).json({ message: 'Username already in use.' });

    const newUser = await User.create({ username, password });
    return res.status(201).json({ message: 'Signup successful!', user: { id: newUser.id, username: newUser.username } });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.changePassword = async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;
  if (!userId || !currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }
  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect.' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    return res.status(200).json({ message: 'Password changed successfully!' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};


exports.businessSignup = async (req, res) => {
  const { username, password } = req.body;
  try {
    const existingBusiness = await Business.findOne({ where: { username } });
    if (existingBusiness) return res.status(400).json({ message: 'Username already in use.' });

    const newBusiness = await Business.create({
      username,
      password,
      status: 'pending',
      goal: 10,
      rewardText: 'Free item on goal'
    });

    return res.status(201).json({
      message: 'Application submitted. Pending approval.',
      business: { id: newBusiness.id, username: newBusiness.username, status: newBusiness.status }
    });
  } catch (error) {
    console.error('Business signup error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.businessLogin = async (req, res) => {
  const { username, password } = req.body;
  try {
    const business = await Business.findOne({ where: { username } });
    if (!business) return res.status(400).json({ message: 'Invalid credentials.' });

    const isMatch = await bcrypt.compare(password, business.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials.' });

    if (business.status !== 'approved') {
      return res.status(403).json({ message: 'Your application is pending approval.' });
    }

    return res.status(200).json({
      message: 'Login successful!',
      business: { id: business.id, username: business.username, goal: business.goal, rewardText: business.rewardText }
    });
  } catch (error) {
    console.error('Business login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};


// POST /api/approve-business   (header: x-admin-token: ADMIN_TOKEN)
exports.approveBusiness = async (req, res) => {
  try {
    const token = req.headers['x-admin-token'] || '';
    if (token !== process.env.ADMIN_TOKEN) return res.status(401).json({ message: 'Unauthorized' });

    const { username } = req.body || {};
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

// GET /api/business-offer?username=...
exports.getBusinessOffer = async (req, res) => {
  try {
    const { username } = req.query || {};
    const biz = await Business.findOne({ where: { username } });
    if (!biz) return res.status(404).json({ message: 'Business not found' });
    return res.json({ goal: biz.goal, rewardText: biz.rewardText });
  } catch (e) {
    console.error('getBusinessOffer error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/business-offer  { username, goal?, rewardText? }
exports.updateBusinessOffer = async (req, res) => {
  try {
    const { username, goal, rewardText } = req.body || {};
    const biz = await Business.findOne({ where: { username } });
    if (!biz) return res.status(404).json({ message: 'Business not found' });

    if (goal !== undefined) biz.goal = Math.max(1, parseInt(goal, 10) || 10);
    if (rewardText !== undefined) biz.rewardText = String(rewardText).slice(0, 140);
    await biz.save();

    return res.json({ message: 'Offer updated', goal: biz.goal, rewardText: biz.rewardText });
  } catch (e) {
    console.error('updateBusinessOffer error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};
