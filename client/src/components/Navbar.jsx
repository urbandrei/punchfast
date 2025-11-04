import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../index.css';

const Navbar = ({ isLoggedIn, currentUser, onShowAuth, onChangePassword, onSignOut }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <nav className="navbar navbar-expand-lg mb-4" style={{
      backgroundColor: '#A7CCDE',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    }}>
      <div className="container-fluid px-4">
        <Link
          to="/"
          className="navbar-brand fw-bold fs-3"
          style={{
            color: '#302C9A',
            letterSpacing: '1px',
            textDecoration: 'none'
          }}
        >
          Punchfast
        </Link>
        <div className="d-flex gap-3 ms-auto align-items-center">
          {isLoggedIn && (
            <Link
              to="/dashboard"
              style={{
                color: '#302C9A',
                textDecoration: 'none',
                fontWeight: '500',
                transition: 'color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.color = '#6AB7AD'}
              onMouseOut={(e) => e.target.style.color = '#302C9A'}
            >
              Dashboard
            </Link>
          )}
          {!isLoggedIn ? (
            <button
              className="btn px-4 py-2"
              onClick={onShowAuth}
              style={{
                backgroundColor: '#302C9A',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                fontWeight: '500',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#6AB7AD';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#302C9A';
                e.target.style.transform = 'scale(1)';
              }}
            >
              Sign In
            </button>
          ) : (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#302C9A',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: '8px 16px',
                  borderRadius: '25px',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(106, 183, 173, 0.1)'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
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
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        backgroundColor: 'white',
                        border: 'none',
                        textAlign: 'left',
                        color: '#302C9A',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        borderBottom: '1px solid #A7CCDE'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                      onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
                    >
                      Change Password
                    </button>
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        onSignOut();
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        backgroundColor: 'white',
                        border: 'none',
                        textAlign: 'left',
                        color: '#E68E8D',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                      onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
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
