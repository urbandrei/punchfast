import React, { useState } from "react";
import axios from "axios";

export default function BusinessAuthModal({ show, onClose, onLoginSuccess }) {
    const API = "https://punchfast-backend.onrender.com/api";

    const [mode, setMode] = useState("login"); 
    const [otpStage, setOtpStage] = useState(false);

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [legalName, setLegalName] = useState("");
    const [address, setAddress] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    if (!show) return null;

    const reset = () => {
        setUsername("");
        setEmail("");
        setLegalName("");
        setAddress("");
        setPhone("");
        setPassword("");
        setConfirmPassword("");
        setOtp("");
        setOtpStage(false);
        setError("");
        setLoading(false);
    };

    const close = () => {
        reset();
        onClose();
    };

    // --------------------------
    // BUSINESS SIGNUP → SEND OTP
    // --------------------------
    const sendSignupOtp = async () => {
        if (!username || !email || !legalName || !address || !phone || !password || !confirmPassword) {
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
            const res = await axios.post(`${API}/business/signup/send-otp`, {
                username, email, password, legalName, address, phone
            });

            if (res.data.success) setOtpStage(true);
        } catch (err) {
            setError(err.response?.data?.message || "Error sending OTP");
        }

        setLoading(false);
    };

    // --------------------------
    // VERIFY SIGNUP OTP
    // --------------------------
    const verifySignupOtp = async () => {
        setLoading(true);
        setError("");

        try {
            const res = await axios.post(`${API}/business/signup/verify-otp`, {
                username, otp
            });

            if (res.data.success) {
                alert("Business account created! You may now login.");
                setMode("login");
                reset();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Invalid OTP");
        }

        setLoading(false);
    };

    // --------------------------
    // LOGIN
    // --------------------------
    const login = async () => {
        if (!username || !password) {
            setError("Enter username and password");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await axios.post(
                `${API}/business/login`,
                { username, password },
                { withCredentials: true }
            );

            if (res.data.success) {
                onLoginSuccess(res.data.business);
                close();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Login failed");
        }

        setLoading(false);
    };

    // --------------------------
    // FORGOT PASSWORD → SEND OTP
    // --------------------------
    const sendForgotOtp = async () => {
        if (!username) {
            setError("Enter username");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await axios.post(`${API}/business/forgot-password`, { username });

            if (res.data.success) setMode("verifyForgot");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to send OTP");
        }

        setLoading(false);
    };

    // --------------------------
    // VERIFY OTP FOR RESET
    // --------------------------
    const verifyForgotOtp = async () => {
        if (!otp) {
            setError("Enter OTP");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await axios.post(`${API}/business/forgot-password/verify`, {
                username, otp
            });

            if (res.data.success) setMode("reset");
        } catch (err) {
            setError(err.response?.data?.message || "Invalid OTP");
        }

        setLoading(false);
    };

    // --------------------------
    // RESET PASSWORD
    // --------------------------
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
            const res = await axios.post(`${API}/business/reset-password`, {
                username,
                newPassword: password
            });

            if (res.data.success) {
                alert("Password changed!");
                setMode("login");
                reset();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Reset failed");
        }

        setLoading(false);
    };

    // -------------------------------------------------
    // UI RENDER
    // -------------------------------------------------
    return (
        <div className="modal-bg">
            <div className="auth-modal">

                <button className="close-btn" onClick={close}>✖</button>

                {/* TABS */}
                {(mode === "login" || mode === "signup") && (
                    <div className="tabs">
                        <button
                            className={mode === "login" ? "active" : ""}
                            onClick={() => { setMode("login"); reset(); }}
                        >
                            Business Login
                        </button>

                        <button
                            className={mode === "signup" ? "active" : ""}
                            onClick={() => { setMode("signup"); reset(); }}
                        >
                            Business Signup
                        </button>
                    </div>
                )}

                {error && <div className="error-box">{error}</div>}

                {/* LOGIN */}
                {mode === "login" && (
                    <>
                        <input placeholder="Business Username" value={username} onChange={e => setUsername(e.target.value)} />
                        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />

                        <button className="blue-btn" onClick={login} disabled={loading}>
                            {loading ? "Loading..." : "Login"}
                        </button>

                        <button className="link-btn" onClick={() => setMode("forgot")}>
                            Forgot Password?
                        </button>
                    </>
                )}

                {/* SIGNUP (NO OTP YET) */}
                {mode === "signup" && !otpStage && (
                    <>
                        <input placeholder="Business Username" value={username} onChange={e => setUsername(e.target.value)} />
                        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                        <input placeholder="Legal Business Name" value={legalName} onChange={e => setLegalName(e.target.value)} />
                        <input placeholder="Business Address" value={address} onChange={e => setAddress(e.target.value)} />
                        <input placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} />

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
                        <input placeholder="Business Username" value={username} onChange={e => setUsername(e.target.value)} />

                        <button className="blue-btn" onClick={sendForgotOtp} disabled={loading}>
                            {loading ? "Sending..." : "Send OTP"}
                        </button>
                    </>
                )}

                {/* VERIFY FORGOT OTP */}
                {mode === "verifyForgot" && (
                    <>
                        <input placeholder="OTP" value={otp} onChange={e => setOtp(e.target.value)} />

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
