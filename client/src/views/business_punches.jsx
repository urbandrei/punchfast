import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const GOAL = 10; // keep in sync with backend default

const BusinessPunches = ({ business }) => {
  const [businessId, setBusinessId] = useState(business?.username || "");
  const [customerUsername, setCustomerUsername] = useState("");
  const [status, setStatus] = useState("");
  const [punches, setPunches] = useState(null);
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (business && business.username) {
      setBusinessId(business.username);
      localStorage.setItem("pf_business_username", business.username);
      return;
    }

    const saved =
      localStorage.getItem("pf_business_email") ||
      localStorage.getItem("pf_business_username") ||
      "";

    if (saved && !businessId) {
      setBusinessId(saved);
    }
  }, [business, businessId]);

  async function handleRegister(e) {
    e.preventDefault();
    setStatus("");
    setPunches(null);
    setRemaining(null);

    const effectiveBusinessId =
      businessId ||
      (business && business.username) ||
      localStorage.getItem("pf_business_email") ||
      localStorage.getItem("pf_business_username") ||
      "";

    if (!effectiveBusinessId) {
      setStatus("No business session found. Please sign in again.");
      return;
    }

    if (!businessId && effectiveBusinessId) {
      setBusinessId(effectiveBusinessId);
    }

    if (!customerUsername.trim()) {
      setStatus("Please enter a customer username.");
      return;
    }

    try {
      const res = await fetch("/api/punch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_username: customerUsername.trim(),
          business_username: effectiveBusinessId,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus(data.message || "Error");
        setPunches(null);
        setRemaining(null);
        return;
      }

      const newPunches =
        typeof data.punches === "number" ? data.punches : null;

      const newRemaining =
        typeof data.remaining === "number"
          ? data.remaining
          : newPunches == null
          ? null
          : Math.max(GOAL - newPunches, 0);

      setStatus(data.message || "Punch recorded.");
      setPunches(newPunches);
      setRemaining(newRemaining);
    } catch (err) {
      console.error(err);
      setStatus("Network error");
    }
  }

  const headerBusinessLabel =
    businessId || (business && business.username) || "Business";

  return (
    <div className="container py-4">
      {/* Header row with Dashboard button */}
      <div
        className="d-flex justify-content-between align-items-center mb-3"
        style={{ gap: "12px" }}
      >
        <h2
          className="mb-0"
          style={{ color: "#302C9A" }}
        >
          Punchfast Business Portal
        </h2>
        <Link
          to="/business/dashboard"
          className="btn btn-primary"
          style={{
            borderRadius: "25px",
            padding: "8px 20px",
            fontWeight: 500,
          }}
        >
          Dashboard
        </Link>
      </div>

      {headerBusinessLabel ? (
        <div className="alert alert-success text-center">
          You are signed in as <b>{headerBusinessLabel}</b>.
        </div>
      ) : (
        <div className="alert alert-warning text-center">
          No business session found. Please use <b>Business Sign In</b> in the
          top bar.
        </div>
      )}

      <div className="row justify-content-center mt-2">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-3">Register a punch</h5>
              <form onSubmit={handleRegister}>
                <div className="mb-3">
                  <label htmlFor="cust" className="form-label">
                    Customer username
                  </label>
                  <input
                    id="cust"
                    type="text"
                    className="form-control"
                    placeholder="e.g. alice"
                    value={customerUsername}
                    onChange={(e) => setCustomerUsername(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-primary">
                  Register Punch
                </button>
              </form>

              {status && (
                <div className="alert alert-info mt-3">{status}</div>
              )}

              {punches !== null && (
                <div className="mt-2">
                  <p className="mb-1">
                    <b>{customerUsername}</b> now has <b>{punches}</b> punch
                    {punches === 1 ? "" : "es"} at your store.
                  </p>
                  <p className="text-muted mb-0">
                    Remaining to goal ({GOAL}): <b>{remaining}</b>
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BusinessPunches;
