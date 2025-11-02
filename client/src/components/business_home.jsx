import React, { useEffect, useState } from "react";

const GOAL = 10; // keep in sync with backend default

export default function BusinessHome() {
  const [businessEmail, setBusinessEmail] = useState("");
  const [customerUsername, setCustomerUsername] = useState("");
  const [status, setStatus] = useState("");
  const [punches, setPunches] = useState(null);
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    // saved by BusinessLogin on success
    const saved = localStorage.getItem("pf_business_email") || "";
    setBusinessEmail(saved);
  }, []);

  async function handleRegister(e) {
    e.preventDefault();
    setStatus("");

    if (!businessEmail) {
      setStatus("No business email found. Please sign in again.");
      return;
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
          businessEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus(data.message || "Error");
        setPunches(null);
        setRemaining(null);
        return;
      }

      setStatus(data.message || "Punch recorded");
      setPunches(data.punches);
      setRemaining(data.remaining);
    } catch (err) {
      console.error(err);
      setStatus("Network error");
    }
  }

  return (
    <div className="container py-4">
      <h2 className="text-center mb-3">Welcome to Punchfast Business Portal</h2>

      {businessEmail ? (
        <div className="alert alert-success text-center">You are signed in as <b>{businessEmail}</b>.</div>
      ) : (
        <div className="alert alert-warning text-center">No business session found. Please sign in.</div>
      )}

      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-3">Register a punch</h5>
              <form onSubmit={handleRegister}>
                <div className="mb-3">
                  <label htmlFor="cust" className="form-label">Customer username</label>
                  <input
                    id="cust"
                    type="text"
                    className="form-control"
                    placeholder="e.g. alice"
                    value={customerUsername}
                    onChange={(e) => setCustomerUsername(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-primary">Register Punch</button>
              </form>

              {status && <div className="alert alert-info mt-3">{status}</div>}

              {punches !== null && (
                <div className="mt-2">
                  <p className="mb-1">
                    <b>{customerUsername}</b> now has <b>{punches}</b> punch{punches === 1 ? "" : "es"} at your store.
                  </p>
                  <p className="text-muted mb-0">
                    Remaining to goal ({GOAL}): <b>{remaining}</b>
                  </p>
                </div>
              )}
            </div>
          </div>

          <p className="text-muted small mt-3">
            * Goal is shown for information; it can later be made configurable in the dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
