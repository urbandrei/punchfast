import { useState } from "react";

const AuthModal = ({ show, onClose, onLoginSuccess }) => {
    const [activeTab, setActiveTab] = useState("login");

    // Login state
    const [step, setStep] = useState(1); // 1=email, 2=otp, 3=password
    const [username, setUsername] = useState("");
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");

    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    if (!show) return null;

    /* -----------------------------
        SEND OTP (STEP 1)
    ------------------------------*/
    const sendOTP = async () => {
        setIsLoading(true);
        setMessage("");

        const res = await fetch("/api/send-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username }),
        });

        const data = await res.json();
        setMessage(data.message);

        if (data.success) {
            setStep(2);
        }

        setIsLoading(false);
    };

    /* -----------------------------
        VERIFY OTP (STEP 2)
    ------------------------------*/
    const verifyOTP = async () => {
        setIsLoading(true);
        setMessage("");

        const res = await fetch("/api/verify-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, otp }),
        });

        const data = await res.json();
        setMessage(data.message);

        if (data.success) {
            setStep(3);
        }

        setIsLoading(false);
    };

    /* -----------------------------
        FINAL LOGIN (STEP 3)
    ------------------------------*/
    const loginUser = async () => {
        setIsLoading(true);
        setMessage("");

        const res = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ username, password }),
        });

        const data = await res.json();

        if (res.ok) {
            onLoginSuccess(data.user);
            handleClose();
        } else {
            setMessage(data.message);
        }

        setIsLoading(false);
    };

    /* -----------------------------
        SIGNUP
    ------------------------------*/
    const signupUser = async () => {
        setIsLoading(true);
        setMessage("");

        const res = await fetch("/api/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        const data = await res.json();

        if (res.ok) {
            setMessage("Signup successful! You can now sign in.");
            setActiveTab("login");
        } else {
            setMessage(data.message);
        }

        setIsLoading(false);
    };

    /* -----------------------------
        RESET & CLOSE MODAL
    ------------------------------*/
    const handleClose = () => {
        setUsername("");
        setPassword("");
        setOtp("");
        setMessage("");
        setStep(1);
        onClose();
    };

    return (
        <>
            <div
                className="modal d-block"
                tabIndex="-1"
                role="dialog"
                onClick={handleClose}
            >
                <div
                    className="modal-dialog modal-dialog-centered"
                    role="document"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="modal-content">
                        <div className="modal-body px-4 pt-0 pb-4">

                            {/* TABS */}
                            <ul
                                className="nav nav-tabs nav-fill mb-4"
                                role="tablist"
                                style={{ borderBottom: "2px solid #A7CCDE" }}
                            >
                                <li className="nav-item">
                                    <button
                                        className={`nav-link ${activeTab === "login" ? "active" : ""}`}
                                        onClick={() => { setActiveTab("login"); setStep(1); }}
                                        style={{
                                            color: activeTab === "login" ? "#302C9A" : "#6c757d",
                                            fontWeight: activeTab === "login" ? "600" : "400",
                                        }}
                                    >
                                        Sign In
                                    </button>
                                </li>

                                <li className="nav-item">
                                    <button
                                        className={`nav-link ${activeTab === "signup" ? "active" : ""}`}
                                        onClick={() => setActiveTab("signup")}
                                        style={{
                                            color: activeTab === "signup" ? "#302C9A" : "#6c757d",
                                            fontWeight: activeTab === "signup" ? "600" : "400",
                                        }}
                                    >
                                        Sign Up
                                    </button>
                                </li>
                            </ul>

                            {/* ERROR / STATUS MESSAGE */}
                            {message && (
                                <div
                                    className="alert"
                                    style={{
                                        backgroundColor: "rgba(230, 142, 141, 0.1)",
                                        color: "#E68E8D",
                                        border: "1px solid #E68E8D",
                                        borderRadius: "8px",
                                    }}
                                >
                                    {message}
                                </div>
                            )}

                            {/* SIGN UP FORM */}
                            {activeTab === "signup" && (
                                <>
                                    <label className="form-label" style={{ color: "#302C9A", fontWeight: "500" }}>Email</label>
                                    <input
                                        type="email"
                                        className="form-control mb-3"
                                        placeholder="Enter email"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />

                                    <label className="form-label" style={{ color: "#302C9A", fontWeight: "500" }}>Password</label>
                                    <input
                                        type="password"
                                        className="form-control mb-4"
                                        placeholder="Enter password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />

                                    <button
                                        className="btn btn-primary w-100"
                                        onClick={signupUser}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Signing Up..." : "Sign Up"}
                                    </button>
                                </>
                            )}

                            {/* LOGIN (3 STEPS) */}
                            {activeTab === "login" && (
                                <>

                                    {/* STEP 1 — Email */}
                                    {step === 1 && (
                                        <>
                                            <label className="form-label">Email</label>
                                            <input
                                                type="email"
                                                className="form-control mb-3"
                                                placeholder="Enter email"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                            />

                                            <button
                                                className="btn btn-primary w-100"
                                                onClick={sendOTP}
                                                disabled={isLoading}
                                            >
                                                {isLoading ? "Sending..." : "Send OTP"}
                                            </button>
                                        </>
                                    )}

                                    {/* STEP 2 — OTP */}
                                    {step === 2 && (
                                        <>
                                            <label className="form-label">OTP</label>
                                            <input
                                                type="text"
                                                className="form-control mb-3"
                                                placeholder="Enter OTP"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                            />

                                            <button
                                                className="btn btn-primary w-100"
                                                onClick={verifyOTP}
                                                disabled={isLoading}
                                            >
                                                {isLoading ? "Verifying..." : "Verify OTP"}
                                            </button>
                                        </>
                                    )}

                                    {/* STEP 3 — Password */}
                                    {step === 3 && (
                                        <>
                                            <label className="form-label">Password</label>
                                            <input
                                                type="password"
                                                className="form-control mb-3"
                                                placeholder="Enter password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />

                                            <button
                                                className="btn btn-primary w-100"
                                                onClick={loginUser}
                                                disabled={isLoading}
                                            >
                                                {isLoading ? "Logging In..." : "Login"}
                                            </button>
                                        </>
                                    )}
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

