import React from "react";

export default function Navbar({
    isLoggedIn,
    currentUser,
    business,
    onShowAuth,
    onShowBusinessAuth,
    onChangePassword,
    onSignOut,
    onBusinessSignOut
}) {
    return (
        <nav className="navbar">
            <div className="nav-title">Punchfast</div>

            <div className="nav-right">

                {/* ---------------- CUSTOMER NOT LOGGED IN ---------------- */}
                {!isLoggedIn && !business && (
                    <>
                        <button className="signin-btn" onClick={onShowAuth}>
                            User Sign In
                        </button>

                        <button className="signin-btn" onClick={onShowBusinessAuth}>
                            Business Sign In
                        </button>
                    </>
                )}

                {/* ---------------- CUSTOMER LOGGED IN ---------------- */}
                {isLoggedIn && currentUser && (
                    <>
                        <span className="user-tag">Hi, {currentUser.username}</span>

                        <button className="small-btn" onClick={onChangePassword}>
                            Change Password
                        </button>

                        <button className="small-btn red" onClick={onSignOut}>
                            Logout
                        </button>
                    </>
                )}

                {/* ---------------- BUSINESS LOGGED IN ---------------- */}
                {business && !isLoggedIn && (
                    <>
                        <span className="user-tag">Biz: {business.username}</span>

                        <button className="small-btn red" onClick={onBusinessSignOut}>
                            Logout
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
}



