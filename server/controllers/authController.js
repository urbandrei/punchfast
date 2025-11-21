const User = require('../models/user');
const Business = require('../models/business');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');

// Memory stores
const signupOtpStore = {};
const loginOtpStore = {};
const resetOtpStore = {};

// Email sender
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

// ------------------------------
// STEP 1: SIGNUP → SEND OTP
// ------------------------------
exports.requestSignupOtp = async (req, res) => {
    const { username, email, password, isBusiness } = req.body;

    try {
        const Model = isBusiness ? Business : User;

        const userExists = await Model.findOne({ where: { username } });
        if (userExists) return res.status(400).json({ message: "Username already exists" });

        const emailExists = await Model.findOne({ where: { email } });
        if (emailExists) return res.status(400).json({ message: "Email already exists" });

        const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false });

        signupOtpStore[email] = { otp, username, password, isBusiness };

        await sendOtpEmail(email, otp, "Verify your account");

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ message: "Server error" });
    }
};

// ------------------------------
// STEP 2: SIGNUP → VERIFY OTP → CREATE USER
// ------------------------------
exports.completeSignup = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const record = signupOtpStore[email];
        if (!record) return res.status(400).json({ message: "OTP expired" });
        if (record.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });

        const { username, password, isBusiness } = record;

        const Model = isBusiness ? Business : User;

        const hashed = await bcrypt.hash(password, 10);

        await Model.create({
            username,
            email,
            password: hashed
        });

        delete signupOtpStore[email];

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ message: "Server error" });
    }
};

// ------------------------------
// LOGIN STEP 1 → SEND OTP
// ------------------------------
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

// ------------------------------
// LOGIN STEP 2 → VERIFY OTP + ISSUE COOKIE
// ------------------------------
exports.verifyLoginOtp = async (req, res) => {
    const { username, otp } = req.body;

    try {
        if (!loginOtpStore[username])
            return res.status(400).json({ message: "OTP expired" });

        if (loginOtpStore[username] !== otp)
            return res.status(400).json({ message: "Invalid OTP" });

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

// ------------------------------
// FORGOT PASSWORD → SEND OTP
// ------------------------------
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

// ------------------------------
// VERIFY RESET OTP
// ------------------------------
exports.verifyResetOtp = (req, res) => {
    const { username, otp } = req.body;

    if (!resetOtpStore[username])
        return res.status(400).json({ message: "OTP expired" });

    if (resetOtpStore[username] !== otp)
        return res.status(400).json({ message: "Invalid OTP" });

    res.json({ success: true });
};

// ------------------------------
// RESET PASSWORD
// ------------------------------
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

// ------------------------------
// LOGOUT (CLEAR COOKIE)
// ------------------------------
exports.logout = (req, res) => {
    res.clearCookie("token");
    res.json({ success: true });
};



