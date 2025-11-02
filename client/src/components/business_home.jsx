import React, { useState, useMemo } from 'react';

const BusinessHome = ({ isLogin }) => {
  const [customerUsername, setCustomerUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { message, punches }
  const goal = 10;

  // We saved this at business login time
  const businessEmail = useMemo(
    () => localStorage.getItem('businessEmail') || '',
    []
  );

  const handlePunch = async (e) => {
    e.preventDefault();
    setResult(null);

    if (!businessEmail) {
      setResult({ message: 'No business identity found. Please sign in again.', punches: null });
      return;
    }
    if (!customerUsername.trim()) {
      setResult({ message: 'Please enter a customer username.', punches: null });
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/punch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_username: businessEmail,        // using email as business id
          customer_username: customerUsername.trim()
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResult({ message: data.message || 'Server error', punches: null });
      } else {
        setResult({ message: data.message || 'Punch recorded.', punches: data.punches });
      }
    } catch (err) {
      setResult({ message: 'Network error. Try again.', punches: null });
    } finally {
      setSubmitting(false);
    }
  };

  const remaining = result?.punches != null ? (goal - result.punches) : null;

  return (
    <div className="container mt-5" style={{ maxWidth: 640 }}>
      <h1 className="text-center">Business Portal</h1>

      {!isLogin && (
        <div className="alert alert-warning text-center mt-3">
          You are not signed in.
        </div>
      )}

      {isLogin && (
        <>
          <div className="alert alert-info mt-3">
            Signed in as: <strong>{businessEmail || 'Unknown'}</strong>
          </div>

          <div className="card mt-4">
            <div className="card-body">
              <h4 className="card-title mb-3">Register a punch</h4>

              <form onSubmit={handlePunch}>
                <div className="mb-3">
                  <label htmlFor="customerUsername" className="form-label">Customer username</label>
                  <input
                    id="customerUsername"
                    type="text"
                    className="form-control"
                    placeholder="e.g. alice123"
                    value={customerUsername}
                    onChange={(e) => setCustomerUsername(e.target.value)}
                  />
                </div>

                <button className="btn btn-primary" type="submit" disabled={submitting}>
                  {submitting ? 'Registering…' : 'Register punch'}
                </button>
              </form>

              {result?.message && (
                <div className="alert alert-secondary mt-3 mb-0">
                  <div>{result.message}</div>
                  {result.punches != null && (
                    <div className="mt-1">
                      Punches at this business for <strong>{customerUsername || 'this user'}</strong>:
                      <strong> {result.punches}/{goal}</strong>
                      {remaining != null && (
                        <span> — Remaining to goal: <strong>{remaining}</strong></span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BusinessHome;

