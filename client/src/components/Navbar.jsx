import React, { useState, useEffect } from "react";
import AuthModal from "./components/AuthModal";
import ChangePasswordModal from "./components/ChangePasswordModal";
import axios from "axios";

export default function Navbar() {
    const [authModal, setAuthModal] = useState(false);
    const [passwordModal, setPasswordModal] = useState(false);
    const [user, setUser] = useState(null);

    const API = "https://punchfast-backend.onrender.com/api";

    const checkLogin = async () => {
        try {
            const res = await axios.get(`${API}/me`, { withCredentials: true });
            if (res.data?.user) setUser(res.data.user);
        } catch {}
    };

    const logout = async () => {
        await axios.post(`${API}/logout`, {}, { withCredentials: true });
        setUser(null);
    };

    useEffect(() => {
        checkLogin();
    }, []);

    return (
        <nav className="navbar">
            <div className="nav-title">Punchfast</div>

            <div className="nav-right">
                {!user ? (
                    <button className="signin-btn" onClick={() => setAuthModal(true)}>
                        Sign In
                    </button>
                ) : (
                    <>
                        <span className="user-tag">Hi, {user.username}</span>
                        <button className="small-btn" onClick={() => setPasswordModal(true)}>
                            Change Password
                        </button>
                        <button className="small-btn red" onClick={logout}>
                            Logout
                        </button>
                    </>
                )}
            </div>

            {authModal ? (
                <AuthModal
                    onClose={() => setAuthModal(false)}
                    onLoginSuccess={(u) => setUser(u)}
                />
            ) : null}

            {passwordModal ? (
                <ChangePasswordModal onClose={() => setPasswordModal(false)} />
            ) : null}
        </nav>
    );
}

