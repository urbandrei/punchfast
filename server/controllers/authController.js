const User = require('../models/user');
const Business = require('../models/business');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');

const signupOtpStore = {};
const resetOtpStore = {};

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendOtp(to, code, subject) {
    return transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        text: code
    });
}

exports.signupRequestOtp = async (req, res) => {
    const { email } = req.body;
    const code = otpGenerator.generate(6, { upperCase: false, specialChars: false });
    signupOtpStore[email] = code;
    await sendOtp(email, code, "Signup OTP");
    res.json({ success: true });
};

exports.verifySignupOtp = (req, res) => {
    const { email, otp } = req.body;
    if (!signupOtpStore[email]) return res.status(400).json({ message: "OTP expired" });
    if (signupOtpStore[email] !== otp) return res.status(400).json({ message: "Invalid OTP" });
    res.json({ success: true });
};

exports.signup = async (req, res) => {
    const { username, email, password, isBusiness } = req.body;
    const Model = isBusiness ? Business : User;

    const usernameTaken = await Model.findOne({ where: { username } });
    if (usernameTaken) return res.status(400).json({ message: "Username exists" });

    const emailTaken = await Model.findOne({ where: { email } });
    if (emailTaken) return res.status(400).json({ message: "Email exists" });

    await Model.create({ username, email, password });
    delete signupOtpStore[email];
    res.json({ success: true });
};

exports.login = async (req, res) => {
    const { username, password, isBusiness } = req.body;
    const Model = isBusiness ? Business : User;

    const user = await Model.findOne({ where: { username } });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
        { id: user.id, username: user.username, isBusiness },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ success: true, user });
};

exports.forgotRequestOtp = async (req, res) => {
    const { email } = req.body;

    const user =
        (await User.findOne({ where: { email } })) ||
        (await Business.findOne({ where: { email } }));

    if (!user) return res.status(400).json({ message: "Email not found" });

    const code = otpGenerator.generate(6, { upperCase: false, specialChars: false });
    resetOtpStore[email] = code;

    await sendOtp(email, code, "Password Reset OTP");
    res.json({ success: true });
};

exports.verifyResetOtp = (req, res) => {
    const { email, otp } = req.body;
    if (!resetOtpStore[email]) return res.status(400).json({ message: "OTP expired" });
    if (resetOtpStore[email] !== otp) return res.status(400).json({ message: "Invalid OTP" });
    res.json({ success: true });
};

exports.resetPassword = async (req, res) => {
    const { email, newPassword } = req.body;

    const user =
        (await User.findOne({ where: { email } })) ||
        (await Business.findOne({ where: { email } }));

    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    delete resetOtpStore[email];
    res.json({ success: true });
};

exports.logout = (req, res) => {
    res.clearCookie("token");
    res.json({ success: true });
};
