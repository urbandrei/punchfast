const User = require('../models/user');
const Business = require('../models/business');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');

const otpStore = {}; 
exports.sendOTP = async (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ message: "Username required" });
    }

    const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false });
    otpStore[username] = otp;

    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: "PunchFast Login",
            to: username, // username is email
            subject: "Your OTP Code",
            text: `Your OTP code is: ${otp}`
        });

        return res.json({ success: true, message: "OTP sent!" });

    } catch (err) {
        console.log("Email error:", err);
        return res.status(500).json({ message: "Email error" });
    }
};

exports.verifyOTP = async (req, res) => {
    const { username, otp } = req.body;

    if (!otpStore[username]) {
        return res.status(400).json({ message: "OTP expired or missing" });
    }

    if (otpStore[username] !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
    }

    delete otpStore[username];
    return res.json({ success: true });
};

exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ where: { username } });
        if (!user) return res.status(400).json({ message: "Invalid credentials." });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ message: "Invalid credentials." });


        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            message: "Login successful!",
            user: { id: user.id, username: user.username }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};



exports.signup = async (req, res) => {
    const { username, password } = req.body;

    try {
        const existing = await User.findOne({ where: { username } });
        if (existing) {
            return res.status(400).json({ message: 'Username already in use.' });
        }

        const hashed = await bcrypt.hash(password, 10);

        const newUser = await User.create({ username, password: hashed });

        return res.status(201).json({
            message: 'Signup successful!',
            user: { id: newUser.id, username: newUser.username }
        });

    } catch (err) {
        console.error("Signup error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};



exports.businessLogin = async (req, res) => {
    const { username, password } = req.body;

    try {
        const business = await Business.findOne({ where: { username } });
        if (!business) return res.status(400).json({ message: "Invalid credentials." });

        const match = await bcrypt.compare(password, business.password);
        if (!match) return res.status(400).json({ message: "Invalid credentials." });

        const token = jwt.sign(
            { id: business.id, username: business.username, business: true },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({
            message: 'Login successful!',
            business: { id: business.id, username: business.username }
        });

    } catch (error) {
        console.error('Business login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.businessSignup = async (req, res) => {
    const { username, password } = req.body;

    try {
        const existing = await Business.findOne({ where: { username } });
        if (existing) {
            return res.status(400).json({ message: 'Username already in use.' });
        }

        const hashed = await bcrypt.hash(password, 10);
        const newBusiness = await Business.create({ username, password: hashed });

        res.status(201).json({
            message: 'Signup successful!',
            business: { id: newBusiness.id, username: newBusiness.username }
        });

    } catch (err) {
        console.error("Business signup error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};



exports.changePassword = async (req, res) => {
    const { userId, currentPassword, newPassword } = req.body;

    if (!userId || !currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Missing fields.' });
    }

    try {
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) return res.status(400).json({ message: 'Current password incorrect.' });

        const hashed = await bcrypt.hash(newPassword, 10);
        user.password = hashed;
        await user.save();

        res.json({ message: 'Password changed successfully!' });

    } catch (err) {
        console.error("Password change error:", err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.logout = (req, res) => {
    res.clearCookie("token");
    return res.json({ success: true, message: "Logged out" });
};
