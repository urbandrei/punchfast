import React, { useEffect, useState } from "react";

const BusinessDashboard = ({ business }) => {
  const [businessId, setBusinessId] = useState(business?.username || "");

  useEffect(() => {
    if (business && business.username) {
      setBusinessId(business.username);
      // keep it in localStorage for refreshes / direct URL visits
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

  if (!businessId) {
    return (
      <div className="container" style={{ marginTop: "40px" }}>
        <div
          className="card shadow-sm mx-auto"
          style={{
            maxWidth: "600px",
            borderRadius: "16px",
            padding: "32px 24px",
          }}
        >
          <h2
            className="text-center mb-3"
            style={{ color: "#302C9A", margin: 0 }}
          >
            Business Dashboard
          </h2>
          <p
            className="text-center mt-2"
            style={{ color: "#6AB7AD", marginBottom: 0 }}
          >
            Please sign in as a business using the{" "}
            <b>Business Sign In</b> button in the top bar to view your
            dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ marginTop: "40px" }}>
      <div
        className="card shadow-sm mx-auto"
        style={{
          maxWidth: "700px",
          borderRadius: "16px",
          padding: "32px 24px",
        }}
      >
        <h2
          className="text-center mb-3"
          style={{ color: "#302C9A", margin: 0 }}
        >
          Business Dashboard
        </h2>
        <p
          className="text-center mb-4"
          style={{ color: "#6AB7AD", fontSize: "0.95rem" }}
        >
          Signed in as <b>{businessId}</b>.
        </p>

        <div className="row g-3">
          <div className="col-12 col-md-6">
            <div
              className="p-3 h-100"
              style={{
                borderRadius: "12px",
                border: "1px solid #A7CCDE",
                backgroundColor: "#ffffff",
              }}
            >
              <h5 style={{ color: "#302C9A" }} className="mb-1">
                Punchcard Summary
              </h5>
              <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
                Dashboard wiring is ready. Once we add a stats API, we’ll show
                total customers, total punches, and rewards here.
              </p>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div
              className="p-3 h-100"
              style={{
                borderRadius: "12px",
                border: "1px solid #A7CCDE",
                backgroundColor: "#ffffff",
              }}
            >
              <h5 style={{ color: "#302C9A" }} className="mb-1">
                Coming soon
              </h5>
              <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
                Future metrics: visits per day, top customers, and redemption
                rates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboard;
