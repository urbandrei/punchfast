import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BusinessAuthModal = ({ show, onClose, onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState('login');

  // shared login/signup username + password
  const [username, setUsername] = useState('');

  // signup-only fields
  const [legalName, setLegalName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  if (!show) return null;

  const resetFields = () => {
    setUsername('');
    setLegalName('');
    setEmail('');
    setAddress('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setMessage('');
  };

  const handleClose = () => {
    resetFields();
    onClose();
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    resetFields();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    // Basic validation for signup tab
    if (activeTab === 'signup') {
      if (
        !username ||
        !legalName ||
        !email ||
        !address ||
        !phone ||
        !password ||
        !confirmPassword
      ) {
        setIsLoading(false);
        setMessage('Please fill in all required fields.');
        return;
      }
      if (password !== confirmPassword) {
        setIsLoading(false);
        setMessage('Passwords do not match.');
        return;
      }
    }

    const endpoint =
      activeTab === 'login' ? '/api/business/login' : '/api/business/signup';

    // payload: keep username/password for compatibility; extra fields for signup
    const payload =
      activeTab === 'login'
        ? { username, password }
        : {
            username,
            password,
            legalName,
            email,
            address,
            phone,
          };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        if (activeTab === 'login') {
          // successful business login
          if (data.business && onLoginSuccess) {
            onLoginSuccess(data.business);
          }

          // close modal
          handleClose();

          // navigate to punches page (client-side)
          navigate('/business/punches');
        } else {
          // successful signup: show pending message, keep modal open
          setMessage(
            data.message ||
              'Application submitted. Your business is pending approval.'
          );
          // clear only passwords so they can re-enter if needed
          setPassword('');
          setConfirmPassword('');
        }
      } else {
        setMessage(data.message || 'An error occurred. Please try again.');
      }
    } catch (error) {
      console.error('Business auth error:', error);
      setMessage('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
              {/* Tabs header, styled like AuthModal */}
              <ul
                className="nav nav-tabs nav-fill mb-4"
                role="tablist"
                style={{ borderBottom: '2px solid #A7CCDE' }}
              >
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${
                      activeTab === 'login' ? 'active' : ''
                    }`}
                    onClick={() => handleTabChange('login')}
                    type="button"
                    style={{
                      color:
                        activeTab === 'login' ? '#302C9A' : '#6c757d',
                      borderColor:
                        activeTab === 'login'
                          ? '#A7CCDE #A7CCDE #fff'
                          : 'transparent',
                      fontWeight: activeTab === 'login' ? '600' : '400',
                    }}
                  >
                    Business Sign In
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${
                      activeTab === 'signup' ? 'active' : ''
                    }`}
                    onClick={() => handleTabChange('signup')}
                    type="button"
                    style={{
                      color:
                        activeTab === 'signup' ? '#302C9A' : '#6c757d',
                      borderColor:
                        activeTab === 'signup'
                          ? '#A7CCDE #A7CCDE #fff'
                          : 'transparent',
                      fontWeight: activeTab === 'signup' ? '600' : '400',
                    }}
                  >
                    Business Sign Up
                  </button>
                </li>
              </ul>

              {message && (
                <div
                  className="alert"
                  role="alert"
                  style={{
                    backgroundColor: 'rgba(230, 142, 141, 0.1)',
                    color: '#E68E8D',
                    border: '1px solid #E68E8D',
                    borderRadius: '8px',
                  }}
                >
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label
                    htmlFor="business-username"
                    className="form-label"
                    style={{ color: '#302C9A', fontWeight: '500' }}
                  >
                    Business Username
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="business-username"
                    placeholder="Choose a username for your business"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoComplete="username"
                    style={{ borderColor: '#A7CCDE', borderRadius: '8px' }}
                    onFocus={(e) =>
                      (e.target.style.borderColor = '#6AB7AD')
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor = '#A7CCDE')
                    }
                  />
                </div>

                {activeTab === 'signup' && (
                  <>
                    <div className="mb-3">
                      <label
                        htmlFor="business-legal-name"
                        className="form-label"
                        style={{ color: '#302C9A', fontWeight: '500' }}
                      >
                        Legal Business Name
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="business-legal-name"
                        placeholder="Exact legal name"
                        value={legalName}
                        onChange={(e) => setLegalName(e.target.value)}
                        required={activeTab === 'signup'}
                        style={{
                          borderColor: '#A7CCDE',
                          borderRadius: '8px',
                        }}
                        onFocus={(e) =>
                          (e.target.style.borderColor = '#6AB7AD')
                        }
                        onBlur={(e) =>
                          (e.target.style.borderColor = '#A7CCDE')
                        }
                      />
                    </div>

                    <div className="mb-3">
                      <label
                        htmlFor="business-email"
                        className="form-label"
                        style={{ color: '#302C9A', fontWeight: '500' }}
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        id="business-email"
                        placeholder="business@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required={activeTab === 'signup'}
                        autoComplete="email"
                        style={{
                          borderColor: '#A7CCDE',
                          borderRadius: '8px',
                        }}
                        onFocus={(e) =>
                          (e.target.style.borderColor = '#6AB7AD')
                        }
                        onBlur={(e) =>
                          (e.target.style.borderColor = '#A7CCDE')
                        }
                      />
                    </div>

                    <div className="mb-3">
                      <label
                        htmlFor="business-phone"
                        className="form-label"
                        style={{ color: '#302C9A', fontWeight: '500' }}
                      >
                        Phone
                      </label>
                      <input
                        type="tel"
                        className="form-control"
                        id="business-phone"
                        placeholder="Business phone number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required={activeTab === 'signup'}
                        style={{
                          borderColor: '#A7CCDE',
                          borderRadius: '8px',
                        }}
                        onFocus={(e) =>
                          (e.target.style.borderColor = '#6AB7AD')
                        }
                        onBlur={(e) =>
                          (e.target.style.borderColor = '#A7CCDE')
                        }
                      />
                    </div>

                    <div className="mb-3">
                      <label
                        htmlFor="business-address"
                        className="form-label"
                        style={{ color: '#302C9A', fontWeight: '500' }}
                      >
                        Business Address
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="business-address"
                        placeholder="Street, city, state, ZIP"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required={activeTab === 'signup'}
                        style={{
                          borderColor: '#A7CCDE',
                          borderRadius: '8px',
                        }}
                        onFocus={(e) =>
                          (e.target.style.borderColor = '#6AB7AD')
                        }
                        onBlur={(e) =>
                          (e.target.style.borderColor = '#A7CCDE')
                        }
                      />
                    </div>
                  </>
                )}

                {/* Password + confirm */}
                <div className="mb-3">
                  <label
                    htmlFor="business-password"
                    className="form-label"
                    style={{ color: '#302C9A', fontWeight: '500' }}
                  >
                    {activeTab === 'login'
                      ? 'Password'
                      : 'Create Password'}
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="business-password"
                    placeholder={
                      activeTab === 'login'
                        ? 'Enter password'
                        : 'Create a strong password'
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={
                      activeTab === 'login'
                        ? 'current-password'
                        : 'new-password'
                    }
                    style={{ borderColor: '#A7CCDE', borderRadius: '8px' }}
                    onFocus={(e) =>
                      (e.target.style.borderColor = '#6AB7AD')
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor = '#A7CCDE')
                    }
                  />
                </div>

                {activeTab === 'signup' && (
                  <div className="mb-4">
                    <label
                      htmlFor="business-confirm-password"
                      className="form-label"
                      style={{ color: '#302C9A', fontWeight: '500' }}
                    >
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="business-confirm-password"
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(e.target.value)
                      }
                      required={activeTab === 'signup'}
                      autoComplete="new-password"
                      style={{
                        borderColor: '#A7CCDE',
                        borderRadius: '8px',
                      }}
                      onFocus={(e) =>
                        (e.target.style.borderColor = '#6AB7AD')
                      }
                      onBlur={(e) =>
                        (e.target.style.borderColor = '#A7CCDE')
                      }
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={isLoading}
                  style={{
                    borderRadius: '8px',
                    padding: '12px',
                    fontWeight: '500',
                  }}
                >
                  {isLoading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      {activeTab === 'login'
                        ? 'Signing In...'
                        : 'Signing Up...'}
                    </>
                  ) : activeTab === 'login' ? (
                    'Sign In'
                  ) : (
                    'Sign Up'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show"></div>
    </>
  );
};

export default BusinessAuthModal;
