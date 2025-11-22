import React, { useState } from "react";
import axios from "axios";

export default function AuthModal({ show, onClose, onLoginSuccess }) {
    const API = "https://punchfast-backend.onrender.com/api";

    const [mode, setMode] = useState("login"); // login | signup | forgot | verifyForgot | reset
    const [otpStage, setOtpStage] = useState(false); // signup OTP stage

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    if (!show) return null;

    const resetAll = () => {
        setUsername("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setOtp("");
        setError("");
        setLoading(false);
        setOtpStage(false);
    };

    const closeModal = () => {
        resetAll();
        onClose();
    };

    // -------------------------
    // SIGNUP → SEND OTP
    // -------------------------
    const sendSignupOtp = async () => {
        if (!username || !email || !password || !confirmPassword) {
            setError("All fields are required");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await axios.post(`${API}/signup/send-otp`, {
                username,
                email,
                password
            });

            if (res.data.success) {
                setOtpStage(true);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to send OTP");
        }

        setLoading(false);
    };

    // -------------------------
    // VERIFY SIGNUP OTP
    // -------------------------
    const verifySignupOtp = async () => {
        setLoading(true);
        setError("");

        try {
            const res = await axios.post(`${API}/signup/verify-otp`, {
                username,
                otp
            });

            if (res.data.success) {
                alert("Account created! You can now login.");
                setMode("login");
                resetAll();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Invalid OTP");
        }

        setLoading(false);
    };

    // -------------------------
    // LOGIN
    // -------------------------
    const login = async () => {
        if (!username || !password) {
            setError("Enter username and password");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await axios.post(
                `${API}/login`,
                { username, password },
                { withCredentials: true }
            );

            if (res.data.success) {
                onLoginSuccess(res.data.user);
                closeModal();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Login failed");
        }

        setLoading(false);
    };

    // -------------------------
    // FORGOT PASSWORD → SEND OTP
    // -------------------------
    const sendForgotOtp = async () => {
        if (!username) {
            setError("Enter username");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await axios.post(`${API}/forgot-password`, {
                username
            });

            if (res.data.success) {
                setMode("verifyForgot");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Error sending OTP");
        }

        setLoading(false);
    };

    // -------------------------
    // VERIFY FORGOT-PASSWORD OTP
    // -------------------------
    const verifyForgotOtp = async () => {
        if (!otp) {
            setError("Enter OTP");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await axios.post(`${API}/forgot-password/verify`, {
                username,
                otp
            });

            if (res.data.success) {
                setMode("reset");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Invalid OTP");
        }

        setLoading(false);
    };

    // -------------------------
    // RESET PASSWORD
    // -------------------------
    const resetPassword = async () => {
        if (!password || !confirmPassword) {
            setError("Enter password");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await axios.post(`${API}/reset-password`, {
                username,
                newPassword: password
            });

            if (res.data.success) {
                alert("Password updated successfully!");
                setMode("login");
                resetAll();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to reset password");
        }

        setLoading(false);
    };

    // -------------------------
    // RENDER UI
    // -------------------------
    return (
        <div className="modal-bg">
            <div className="auth-modal">
                <button className="close-btn" onClick={closeModal}>✖</button>

                {(mode === "login" || mode === "signup") && (
                    <div className="tabs">
                        <button
                            className={mode === "login" ? "active" : ""}
                            onClick={() => { setMode("login"); resetAll(); }}
                        >
                            Login
                        </button>

                        <button
                            className={mode === "signup" ? "active" : ""}
                            onClick={() => { setMode("signup"); resetAll(); }}
                        >
                            Signup
                        </button>
                    </div>
                )}

                {error && <div className="error-box">{error}</div>}

                {/* LOGIN */}
                {mode === "login" && (
                    <>
                        <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
                        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />

                        <button className="blue-btn" onClick={login} disabled={loading}>
                            {loading ? "Loading..." : "Login"}
                        </button>

                        <button className="link-btn" onClick={() => setMode("forgot")}>
                            Forgot Password?
                        </button>
                    </>
                )}

                {/* SIGNUP */}
                {mode === "signup" && !otpStage && (
                    <>
                        <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
                        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                        <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />

                        <button className="blue-btn" onClick={sendSignupOtp} disabled={loading}>
                            {loading ? "Sending OTP..." : "Send OTP"}
                        </button>
                    </>
                )}

                {/* SIGNUP OTP */}
                {mode === "signup" && otpStage && (
                    <>
                        <input placeholder="Enter OTP" value={otp} onChange={e => setOtp(e.target.value)} />

                        <button className="blue-btn" onClick={verifySignupOtp} disabled={loading}>
                            {loading ? "Verifying..." : "Verify OTP"}
                        </button>

                        <button className="link-btn" onClick={sendSignupOtp}>
                            Resend OTP
                        </button>
                    </>
                )}

                {/* FORGOT PASSWORD */}
                {mode === "forgot" && (
                    <>
                        <input placeholder="Enter Username" value={username} onChange={e => setUsername(e.target.value)} />

                        <button className="blue-btn" onClick={sendForgotOtp} disabled={loading}>
                            {loading ? "Sending..." : "Send OTP"}
                        </button>
                    </>
                )}

                {/* VERIFY FORGOT OTP */}
                {mode === "verifyForgot" && (
                    <>
                        <input placeholder="Enter OTP" value={otp} onChange={e => setOtp(e.target.value)} />

                        <button className="blue-btn" onClick={verifyForgotOtp} disabled={loading}>
                            {loading ? "Checking..." : "Verify OTP"}
                        </button>
                    </>
                )}

                {/* RESET PASSWORD */}
                {mode === "reset" && (
                    <>
                        <input type="password" placeholder="New Password" value={password} onChange={e => setPassword(e.target.value)} />
                        <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />

                        <button className="blue-btn" onClick={resetPassword} disabled={loading}>
                            {loading ? "Saving..." : "Reset Password"}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}




