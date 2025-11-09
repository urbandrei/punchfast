const User = require('../models/user');
const Business = require('../models/business');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        res.status(200).json({ message: 'Login successful!', user: { id: user.id, username: user.username } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.signup = async (req, res) => {
    const { username, password } = req.body;
    try {
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already in use.' });
        }

        const newUser = await User.create({ username, password });
        res.status(201).json({ message: 'Signup successful!', user: { id: newUser.id, username: newUser.username } });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.businessLogin = async (req, res) => {
    const { username, password } = req.body;
    try {
        const business = await Business.findOne({ where: { username } });
        if (!business) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, business.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        res.status(200).json({ message: 'Login successful!', business: { id: business.id, username: business.username } });
    } catch (error) {
        console.error('Business login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.businessSignup = async (req, res) => {
    const { username, password } = req.body;
    try {
        const existingBusiness = await Business.findOne({ where: { username } });
        if (existingBusiness) {
            return res.status(400).json({ message: 'Username already in use.' });
        }

        const newBusiness = await Business.create({ username, password });
        res.status(201).json({ message: 'Signup successful!', business: { id: newBusiness.id, username: newBusiness.username } });
    } catch (error) {
        console.error('Business signup error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.changePassword = async (req, res) => {
    const { userId, currentPassword, newPassword } = req.body;

    if (!userId || !currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Missing required fields.' });
    }

    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: 'Password changed successfully!' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};