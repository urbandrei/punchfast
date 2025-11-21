const User = require('../models/user');
const Business = require('../models/business');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');

const loginOtpStore = {};
const resetOtpStore = {};

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendOtpEmail(to, otp, subject) {
    return transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        text: `Your OTP code is: ${otp}`
    });
}

exports.requestLoginOtp = async (req, res) => {
    const { username, password, isBusiness } = req.body;
    try {
        const Model = isBusiness ? Business : User;
        const account = await Model.findOne({ where: { username } });
        if (!account) return res.status(400).json({ message: "Username not found" });

        const match = await bcrypt.compare(password, account.password);
        if (!match) return res.status(400).json({ message: "Incorrect password" });

        const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false });
        loginOtpStore[username] = otp;

        await sendOtpEmail(account.email, otp, "Your Login OTP");
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.verifyLoginOtp = async (req, res) => {
    const { username, otp } = req.body;
    try {
        const stored = loginOtpStore[username];
        if (!stored) return res.status(400).json({ message: "OTP expired" });
        if (stored !== otp) return res.status(400).json({ message: "Invalid OTP" });

        delete loginOtpStore[username];

        let user =
            (await User.findOne({ where: { username } })) ||
            (await Business.findOne({ where: { username } }));

        if (!user) return res.status(404).json({ message: "User not found" });

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

        res.json({ success: true, user: { id: user.id, username: user.username } });
    } catch (e) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.signup = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const exists = await User.findOne({ where: { username } });
        if (exists) return res.status(400).json({ message: "Username exists" });

        const emailExists = await User.findOne({ where: { email } });
        if (emailExists) return res.status(400).json({ message: "Email exists" });

        await User.create({ username, email, password });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.businessSignup = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const exists = await Business.findOne({ where: { username } });
        if (exists) return res.status(400).json({ message: "Username exists" });

        const emailExists = await Business.findOne({ where: { email } });
        if (emailExists) return res.status(400).json({ message: "Email exists" });

        await Business.create({ username, email, password });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.forgotPassword = async (req, res) => {
    const { username } = req.body;
    try {
        const user =
            (await User.findOne({ where: { username } })) ||
            (await Business.findOne({ where: { username } }));

        if (!user) return res.status(400).json({ message: "Username not found" });

        const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false });
        resetOtpStore[username] = otp;

        await sendOtpEmail(user.email, otp, "Password Reset OTP");
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.verifyResetOtp = (req, res) => {
    const { username, otp } = req.body;
    if (!resetOtpStore[username]) return res.status(400).json({ message: "OTP expired" });
    if (resetOtpStore[username] !== otp) return res.status(400).json({ message: "Invalid OTP" });
    res.json({ success: true });
};

exports.resetPassword = async (req, res) => {
    const { username, newPassword } = req.body;
    try {
        const user =
            (await User.findOne({ where: { username } })) ||
            (await Business.findOne({ where: { username } }));

        if (!user) return res.status(404).json({ message: "User not found" });

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        delete resetOtpStore[username];

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.logout = (req, res) => {
    res.clearCookie("token");
    res.json({ success: true });
};


