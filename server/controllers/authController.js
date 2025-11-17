const User = require('../models/user');
const Business = require('../models/business');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');

const otpStore = {};
const resetOtpStore = {};

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// SEND OTP AFTER PASSWORD MATCH
exports.requestLoginOtp = async (req, res) => {
    const { username, password, isBusiness } = req.body;

    try {
        const Model = isBusiness ? Business : User;
        const user = await Model.findOne({ where: { username } });

        if (!user) return res.status(400).json({ message: "Invalid username" });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ message: "Wrong password" });

        const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false });

        otpStore[username] = { otp, isBusiness, id: user.id, email: user.email };

        await transporter.sendMail({
            from: "PunchFast OTP",
            to: user.email,
            subject: "Your PunchFast Login OTP",
            text: `Your OTP is: ${otp}`
        });

        return res.json({ success: true, message: "OTP sent to email" });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Server error" });
    }
};

// VERIFY OTP AND LOGIN
exports.verifyLoginOtp = async (req, res) => {
    const { username, otp } = req.body;

    if (!otpStore[username]) {
        return res.status(400).json({ message: "OTP expired" });
    }

    if (otpStore[username].otp !== otp) {
        return res.status(400).json({ message: "Incorrect OTP" });
    }

    const { id, email, isBusiness } = otpStore[username];
    const tokenPayload = { id, username, email, isBusiness };

    delete otpStore[username];

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.cookie("auth_token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
        success: true,
        user: { id, username, email, business: isBusiness }
    });
};

// SIGNUP
exports.signup = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) return res.status(400).json({ message: "Username already exists" });

        const existingEmail = await User.findOne({ where: { email } });
        if (existingEmail) return res.status(400).json({ message: "Email already exists" });

        const newUser = await User.create({ username, email, password });
        return res.json({ success: true, user: { id: newUser.id, username, email } });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Server error" });
    }
};

// BUSINESS SIGNUP
exports.businessSignup = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const existingUser = await Business.findOne({ where: { username } });
        if (existingUser) return res.status(400).json({ message: "Username exists" });

        const existingEmail = await Business.findOne({ where: { email } });
        if (existingEmail) return res.status(400).json({ message: "Email exists" });

        const newBusiness = await Business.create({ username, email, password });
        return res.json({ success: true, business: { id: newBusiness.id, username, email } });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Server error" });
    }
};

// LOGOUT
exports.logout = (req, res) => {
    res.clearCookie("auth_token");
    return res.json({ success: true });
};
