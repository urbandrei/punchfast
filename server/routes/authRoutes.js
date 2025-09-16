const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    try {
        const newUser = await User.create({ email, password });
        res.status(201).json({ message: 'User created successfully.' });
    } catch (error) {
        res.status(400).json({ message: 'Error creating user.' });
    }
});

module.exports = router;