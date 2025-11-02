import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const BusinessLogin = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(t);
    }
  }, [message]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsSuccess(false);

    const emailNorm = (email || '').trim().toLowerCase();
    if (!emailNorm || !password) {
      setMessage('Please enter username and password.');
      return;
    }

    try {
      const res = await fetch('/api/business/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailNorm, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.message || 'Login failed.');
        setIsSuccess(false);
        return;
      }

      // Persist for BusinessHome to read (these are the keys BusinessHome checks)
      localStorage.setItem('pf_business_email', emailNorm);
      localStorage.setItem('pf_business_username', emailNorm);
      // clean up any legacy key we might have used previously
      localStorage.removeItem('businessEmail');

      setIsSuccess(true);
      setMessage(data.message || 'Login successful!');
      onLoginSuccess();
    } catch (err) {
      console.error('Login error:', err);
      setIsSuccess(false);
      setMessage('An error occurred. Please try again.');
    }
  };

  return (
    <div className="bg-light position-relative" style={{ minHeight: '100vh' }}>
      <style>{`
        .slide-alert {
          position: absolute;
          top: 20px;
          left: 50%;
          transform: translateX(-50%) scaleY(0);
          min-width: 300px;
          z-index: 1050;
          transition: transform 0.4s cubic-bezier(.4,0,.2,1);
        }
        .slide-alert.show { transform: translateX(-50%) scaleY(1); }
      `}</style>

      <div
        className={`slide-alert alert ${
          message ? (isSuccess ? 'alert-success' : 'alert-danger') : ''
        } text-center${message ? ' show' : ''}`}
        role="alert"
        aria-live="polite"
      >
        {message}
      </div>

      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm mb-4">
        <div className="container-fluid">
          <a className="navbar-brand fw-bold" href="#">Punchfast</a>
          <div className="d-flex ms-auto">
            <Link to="/login" className="btn btn-outline-primary" role="button">Customer</Link>
          </div>
        </div>
      </nav>

      <div className="container">
        <div className="row justify-content-center align-items-center min-vh-100" style={{ marginTop: '-56px' }}>
          <div className="card shadow-sm mx-auto w-100" style={{ maxWidth: '500px' }}>
            <div className="card-body p-4 p-md-5">
              <h2 className="card-title text-center mb-2 fw-bold">Business sign in</h2>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-control"
                    id="username"
                    placeholder="Enter username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="d-flex justify-content-between align-items-center mb-4">
                  <button type="submit" className="btn btn-primary">Sign in</button>
                  {/* placeholder; wire up later */}
                  <button type="button" className="btn btn-link p-0 ms-3">Forgot?</button>
                </div>

                <div className="text-center mt-4">
                  <p className="text-muted mb-0">
                    No account?{' '}
                    <Link to="/business/signup" className="text-decoration-none fw-medium">
                      Sign up
                    </Link>
                  </p>
                </div>
              </form>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessLogin;
