import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../index.css';

const Navbar = ({
  isLoggedIn,
  currentUser,
  onShowAuth,
  onShowBusinessAuth,  
  onChangePassword,
  onSignOut
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <nav
      className="navbar navbar-expand-lg mb-4"
      style={{
        backgroundColor: '#6AB7AD',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div className="nav-bar-content">
        <Link to="/" className="nav-bar-brand">
          Punchfast
        </Link>
        <div className="d-flex gap-3 ms-auto align-items-center">
          {isLoggedIn && (
            <Link to="/dashboard" className="nav-bar-button">
              Dashboard
            </Link>
          )}

          {!isLoggedIn ? (
            <>
              <button
                className="nav-bar-button"
                onClick={onShowAuth}
              >
                Customer Sign In
              </button>
              <button
                className="nav-bar-button"
                onClick={onShowBusinessAuth}
              >
                Business Sign In
              </button>
            </>
          ) : (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="nav-bar-button"
              >
                Welcome back, {currentUser?.username}! ▼
              </button>
              {showDropdown && (
                <>
                  <div
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 999
                    }}
                    onClick={() => setShowDropdown(false)}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '8px',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      minWidth: '180px',
                      zIndex: 1000,
                      overflow: 'hidden'
                    }}
                  >
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        onChangePassword();
                      }}
                      className="nav-bar-dropdown"
                    >
                      Change Password
                    </button>
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        onSignOut();
                      }}
                      className="nav-bar-dropdown"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
