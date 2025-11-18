const User = require('../models/user');
const Business = require('../models/business');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');

// Temporary memory OTP store
const loginOtpStore = {};
const resetOtpStore = {};

// ---------------- EMAIL TRANSPORTER -------------------
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendOtpEmail(to, otp, subject) {
    console.log("Sending OTP to:", to, "OTP:", otp);

    return transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        text: `Your OTP code is: ${otp}`,
    });
}

// --------------------------------------------------
//        LOGIN STEP 1 — CHECK + SEND OTP
// --------------------------------------------------
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

        res.json({ success: true, message: "OTP sent" });

    } catch (err) {
        console.log("LOGIN OTP ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// --------------------------------------------------
//        LOGIN STEP 2 — VERIFY OTP
// --------------------------------------------------
exports.verifyLoginOtp = async (req, res) => {
    const { username, otp } = req.body;

    try {
        const stored = loginOtpStore[username];
        if (!stored) return res.status(400).json({ message: "OTP expired" });
        if (stored !== otp) return res.status(400).json({ message: "Invalid OTP" });

        delete loginOtpStore[username];

        // find user in both tables
        let user =
            (await User.findOne({ where: { username } })) ||
            (await Business.findOne({ where: { username } }));

        if (!user) return res.status(404).json({ message: "User not found" });

        if (!process.env.JWT_SECRET)
            throw new Error("JWT_SECRET missing in environment");

        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
            success: true,
            user: { id: user.id, username: user.username }
        });

    } catch (err) {
        console.log("VERIFY LOGIN OTP ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// --------------------------------------------------
//                 USER SIGNUP
// --------------------------------------------------
exports.signup = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        if (!email) return res.status(400).json({ message: "Email required" });

        const exists = await User.findOne({ where: { username } });
        if (exists) return res.status(400).json({ message: "Username exists" });

        const emailExists = await User.findOne({ where: { email } });
        if (emailExists) return res.status(400).json({ message: "Email exists" });

        const hashed = await bcrypt.hash(password, 10);

        await User.create({ username, email, password: hashed });

        res.json({ success: true, message: "Signup successful" });

    } catch (err) {
        console.log("SIGNUP ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// --------------------------------------------------
//               BUSINESS SIGNUP
// --------------------------------------------------
exports.businessSignup = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        if (!email) return res.status(400).json({ message: "Email required" });

        const exists = await Business.findOne({ where: { username } });
        if (exists) return res.status(400).json({ message: "Username exists" });

        const emailExists = await Business.findOne({ where: { email } });
        if (emailExists) return res.status(400).json({ message: "Email exists" });

        const hashed = await bcrypt.hash(password, 10);

        await Business.create({ username, email, password: hashed });

        res.json({ success: true, message: "Signup successful" });

    } catch (err) {
        console.log("BUSINESS SIGNUP ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// --------------------------------------------------
//         FORGOT PASSWORD — SEND OTP
// --------------------------------------------------
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

        res.json({ success: true, message: "OTP sent" });

    } catch (err) {
        console.log("FORGOT PASSWORD ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// --------------------------------------------------
//             VERIFY RESET OTP
// --------------------------------------------------
exports.verifyResetOtp = (req, res) => {
    const { username, otp } = req.body;

    try {
        if (!resetOtpStore[username])
            return res.status(400).json({ message: "OTP expired" });

        if (resetOtpStore[username] !== otp)
            return res.status(400).json({ message: "Invalid OTP" });

        res.json({ success: true, message: "OTP verified" });

    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// --------------------------------------------------
//               RESET PASSWORD
// --------------------------------------------------
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

        res.json({ success: true, message: "Password updated" });

    } catch (err) {
        console.log("RESET PASSWORD ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// --------------------------------------------------
//                   LOGOUT
// --------------------------------------------------
exports.logout = (req, res) => {
    res.clearCookie("token", { sameSite: "none", secure: true });
    res.json({ success: true });
};
