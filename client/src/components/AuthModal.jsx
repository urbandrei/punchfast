import React, { useState } from "react";
import axios from "axios";

export default function AuthModal({ onClose, onLoginSuccess }) {
    const [tab, setTab] = useState("login");

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [otp, setOtp] = useState("");
    const [otpStage, setOtpStage] = useState(false);

    const [isBusiness, setIsBusiness] = useState(false);

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const API = "https://punchfast-backend.onrender.com/api";  
    // ⚠️ Replace with your own backend URL if needed

    const handleSignup = async () => {
        setError("");
        setLoading(true);

        try {
            const endpoint = isBusiness ? "/business/signup" : "/signup";

            const res = await axios.post(`${API}${endpoint}`, {
                username,
                email,
                password,
            });

            if (res.data.success) {
                alert("Signup successful! You can now login.");
                setTab("login");
                setUsername("");
                setEmail("");
                setPassword("");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Signup failed");
        }
        setLoading(false);
    };

    const handleSendOtp = async () => {
        setError("");
        setLoading(true);

        try {
            const res = await axios.post(
                `${API}/request-login-otp`,
                { username, password, isBusiness },
                { withCredentials: true }
            );

            if (res.data.success) {
                setOtpStage(true);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Server error");
        }

        setLoading(false);
    };

    const handleVerifyOtp = async () => {
        setError("");
        setLoading(true);

        try {
            const res = await axios.post(
                `${API}/verify-login-otp`,
                { username, otp },
                { withCredentials: true }
            );

            if (res.data.success) {
                onLoginSuccess(res.data.user);
                onClose();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Invalid OTP");
        }

        setLoading(false);
    };

    return (
        <div className="modal-bg">
            <div className="auth-modal">
                <button className="close-btn" onClick={onClose}>✖</button>

                {/* Tabs */}
                <div className="tabs">
                    <button
                        className={tab === "login" ? "active" : ""}
                        onClick={() => {
                            setTab("login");
                            setOtpStage(false);
                            setError("");
                        }}
                    >
                        Login
                    </button>

                    <button
                        className={tab === "signup" ? "active" : ""}
                        onClick={() => {
                            setTab("signup");
                            setOtpStage(false);
                            setError("");
                        }}
                    >
                        Signup
                    </button>
                </div>

                {error && <div className="error-box">{error}</div>}

                {/* LOGIN SECTION */}
                {tab === "login" && (
                    <>
                        {!otpStage ? (
                            <>
                                <input
                                    type="text"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />

                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />

                                <label>
                                    <input
                                        type="checkbox"
                                        checked={isBusiness}
                                        onChange={() => setIsBusiness(!isBusiness)}
                                    />{" "}
                                    Business Login
                                </label>

                                <button
                                    className="blue-btn"
                                    onClick={handleSendOtp}
                                    disabled={loading}
                                >
                                    {loading ? "Sending OTP..." : "Send OTP"}
                                </button>
                            </>
                        ) : (
                            <>
                                <input
                                    type="text"
                                    placeholder="Enter OTP"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                />

                                <button
                                    className="blue-btn"
                                    onClick={handleVerifyOtp}
                                    disabled={loading}
                                >
                                    {loading ? "Verifying..." : "Verify OTP"}
                                </button>

                                <button
                                    className="link-btn"
                                    onClick={() => {
                                        setOtpStage(false);
                                        setOtp("");
                                    }}
                                >
                                    Resend?
                                </button>
                            </>
                        )}
                    </>
                )}

                {/* SIGNUP SECTION */}
                {tab === "signup" && (
                    <>
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />

                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        <label>
                            <input
                                type="checkbox"
                                checked={isBusiness}
                                onChange={() => setIsBusiness(!isBusiness)}
                            />{" "}
                            Business Signup
                        </label>

                        <button
                            className="blue-btn"
                            onClick={handleSignup}
                            disabled={loading}
                        >
                            {loading ? "Please wait..." : "Signup"}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

