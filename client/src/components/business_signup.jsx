import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const BusinessSignup = () => {
  const [legalName, setLegalName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(t);
    }
  }, [message]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!legalName || !email || !phone || !address || !password) {
      setMessage('Please fill all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    try {
      const res = await fetch('/api/business/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          legalName,
          email,
          phone,
          address,
          password,
          confirmPassword
        }),
      });

      const data = await res.json().catch(() => ({}));
      setMessage(data.message || (res.ok ? 'Application submitted for approval.' : 'Error'));

      if (res.ok) {
        // reset fields (they cannot login until admin approves)
        setLegalName('');
        setEmail('');
        setPhone('');
        setAddress('');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      console.error('Sign up error:', err);
      setMessage('An error occurred. Please try again.');
    }
  };

  return (
    <div className="bg-light position-relative" style={{ minHeight: '100vh' }}>
      <style>{`
        .slide-alert {
          position: absolute; top: 20px; left: 50%;
          transform: translateX(-50%) scaleY(0);
          min-width: 300px; z-index: 1050;
          transition: transform 0.4s cubic-bezier(.4,0,.2,1);
        }
        .slide-alert.show { transform: translateX(-50%) scaleY(1); }
      `}</style>

      <div className={`slide-alert alert ${message ? 'alert-info show' : ''} text-center`} role="alert">
        {message}
      </div>

      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm mb-4">
        <div className="container-fluid">
          <a className="navbar-brand fw-bold" href="#">Punchfast</a>
          <div className="d-flex ms-auto">
            <Link to="/business/login" className="btn btn-outline-primary" role="button">
              Business Sign in
            </Link>
          </div>
        </div>
      </nav>

      <div className="container">
        <div className="row justify-content-center align-items-center min-vh-100" style={{ marginTop: '-56px' }}>
          <div className="card shadow-sm mx-auto w-100" style={{ maxWidth: '520px' }}>
            <div className="card-body p-4 p-md-5">
              <h2 className="card-title text-center mb-2 fw-bold">Business sign up</h2>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="legalName" className="form-label">Legal Name</label>
                  <input
                    id="legalName"
                    type="text"
                    className="form-control"
                    placeholder="Enter legal name"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    id="email"
                    type="email"
                    className="form-control"
                    placeholder="owner@business.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="phone" className="form-label">Phone</label>
                  <input
                    id="phone"
                    type="text"
                    className="form-control"
                    placeholder="555-111-2222"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="address" className="form-label">Address</label>
                  <input
                    id="address"
                    type="text"
                    className="form-control"
                    placeholder="Street, City"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    id="password"
                    type="password"
                    className="form-control"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    className="form-control"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="d-flex justify-content-between align-items-center mb-2">
                  <button type="submit" className="btn btn-primary">Sign up</button>
                  <span className="text-muted">Already have an account? <Link to="/business/login">Sign in</Link></span>
                </div>

                <p className="text-muted mt-3 mb-0" style={{ fontSize: 13 }}>
                  After submitting, your application stays <b>pending</b> until an admin approves it.
                  You’ll be able to sign in once approved.
                </p>
              </form>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessSignup;
