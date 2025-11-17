import { useState, useEffect } from "react";

const AuthModal = ({ show, onClose, onLoginSuccess }) => {
    const [activeTab, setActiveTab] = useState("login"); 
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState(""); 
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");

    const [isBusiness, setIsBusiness] = useState(false);
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const [recentLogins, setRecentLogins] = useState([]);
    const [cookiesAllowed, setCookiesAllowed] = useState(false);

    // Load remembered logins
    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem("recentLogins")) || [];
        setRecentLogins(saved);
    }, []);

    const rememberLogin = (username, password) => {
        const saved = JSON.parse(localStorage.getItem("recentLogins")) || [];

        const exists = saved.find((u) => u.username === username);
        if (!exists) {
            const updated = [...saved, { username, password }];
            localStorage.setItem("recentLogins", JSON.stringify(updated));
            setRecentLogins(updated);
        }
    };

    const handleRequestOtp = async () => {
        setIsLoading(true);
        setMessage("");

        try {
            const res = await fetch("/api/request-login-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password, isBusiness })
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage(data.message || "Invalid login");
            } else {
                setMessage("OTP sent to your email.");
                setActiveTab("otp");
            }
        } catch (err) {
            setMessage("Server error.");
        }

        setIsLoading(false);
    };

    const handleVerifyOtp = async () => {
        setIsLoading(true);

        try {
            const res = await fetch("/api/verify-login-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, otp })
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage(data.message || "Invalid OTP");
            } else {
                setMessage("Logged in!");

                if (cookiesAllowed) {
                    rememberLogin(username, password);
                }

                onLoginSuccess(data.user);
                onClose();
            }

        } catch (err) {
            setMessage("Server error.");
        }

        setIsLoading(false);
    };

    const handleSignup = async () => {
        setIsLoading(true);

        try {
            const endpoint = isBusiness ? "/api/businessSignup" : "/api/signup";

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password })
            });

            const data = await res.json();

            if (!res.ok) setMessage(data.message);
            else {
                setMessage("Signup successful. You can log in now.");
                setActiveTab("login");
            }
        } catch (err) {
            setMessage("Server error.");
        }

        setIsLoading(false);
    };

    const handleRecentLoginClick = (item) => {
        setUsername(item.username);
        setPassword(item.password);
    };

    if (!show) return null;

    return (
        <>
            <div className="modal d-block" onClick={onClose}>
                <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-content">
                        <div className="modal-body">

                            {/* TABS */}
                            <ul className="nav nav-tabs mb-3">
                                <li className="nav-item">
                                    <button 
                                        className={`nav-link ${activeTab === "login" ? "active" : ""}`}
                                        onClick={() => setActiveTab("login")}
                                    >
                                        Login
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button 
                                        className={`nav-link ${activeTab === "signup" ? "active" : ""}`}
                                        onClick={() => setActiveTab("signup")}
                                    >
                                        Signup
                                    </button>
                                </li>
                            </ul>

                            {/* MESSAGE BOX */}
                            {message && (
                                <div className="alert alert-warning">{message}</div>
                            )}

                            {/* RECENT LOGINS */}
                            {activeTab === "login" && recentLogins.length > 0 && (
                                <div style={{ marginBottom: "10px" }}>
                                    <label style={{ fontWeight: "600" }}>Previous Logins:</label>
                                    {recentLogins.map((item, idx) => (
                                        <div 
                                            key={idx}
                                            style={{ cursor: "pointer", padding: "5px" }}
                                            onClick={() => handleRecentLoginClick(item)}
                                        >
                                            {item.username}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* LOGIN FORM */}
                            {activeTab === "login" && (
                                <>
                                    {/* Username */}
                                    <input 
                                        className="form-control mb-2"
                                        placeholder="Username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />

                                    {/* Password */}
                                    <input 
                                        className="form-control mb-2"
                                        placeholder="Password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />

                                    <div className="form-check mb-2">
                                        <input 
                                            className="form-check-input" 
                                            type="checkbox"
                                            onChange={(e) => setCookiesAllowed(e.target.checked)}
                                        />
                                        <label className="form-check-label">
                                            Remember me / allow cookies
                                        </label>
                                    </div>

                                    {/* Business Login Toggle */}
                                    <div className="form-check mb-3">
                                        <input 
                                            className="form-check-input" 
                                            type="checkbox" 
                                            checked={isBusiness}
                                            onChange={() => setIsBusiness(!isBusiness)}
                                        />
                                        <label className="form-check-label">
                                            Business Login
                                        </label>
                                    </div>

                                    <button 
                                        className="btn btn-primary w-100"
                                        onClick={handleRequestOtp}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Sending OTP..." : "Login → Send OTP"}
                                    </button>

                                    <p 
                                      style={{ 
                                        color: '#302C9A',
                                        cursor: 'pointer',
                                        marginTop:'8px',
                                        textAlign:'right'
                                      }}
                                      onClick={() => setActiveTab("forgot")}
                                    >
                                      Forgot Password?
                                    </p>
                                </>
                            )}

                            {/* OTP SCREEN */}
                            {activeTab === "otp" && (
                                <>
                                    <input
                                        className="form-control mb-3"
                                        placeholder="Enter 6-digit OTP"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                    />

                                    <button
                                        className="btn btn-success w-100"
                                        onClick={handleVerifyOtp}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Verifying OTP..." : "Verify OTP & Login"}
                                    </button>
                                </>
                            )}

                            {/* SIGNUP SCREEN */}
                            {activeTab === "signup" && (
                                <>
                                    <input 
                                        className="form-control mb-2"
                                        placeholder="Username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                    <input 
                                        className="form-control mb-2"
                                        placeholder="Email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                    <input 
                                        className="form-control mb-3"
                                        placeholder="Password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />

                                    <button
                                        className="btn btn-primary w-100"
                                        onClick={handleSignup}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Signing up..." : "Signup"}
                                    </button>
                                </>
                            )}


                        </div>
                    </div>
                </div>
            </div>

            <div className="modal-backdrop show"></div>
        </>
    );
};

export default AuthModal;
