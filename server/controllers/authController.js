const User = require('../models/user');
const Business = require('../models/business');
const bcrypt = require('bcryptjs');

// User login
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

// User signup
exports.signup = async (req, res) => {
    const { username, password } = req.body;
    try {
        // Check if user already exists
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already in use.' });
        }

        // Create new user
        const newUser = await User.create({ username, password });
        res.status(201).json({ message: 'Signup successful!', user: { id: newUser.id, username: newUser.username } });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Business login
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

// Business signup
exports.businessSignup = async (req, res) => {
    const { username, password } = req.body;
    try {
        // Check if business already exists
        const existingBusiness = await Business.findOne({ where: { username } });
        if (existingBusiness) {
            return res.status(400).json({ message: 'Username already in use.' });
        }

        // Create new business
        const newBusiness = await Business.create({ username, password });
        res.status(201).json({ message: 'Signup successful!', business: { id: newBusiness.id, username: newBusiness.username } });
    } catch (error) {
        console.error('Business signup error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};