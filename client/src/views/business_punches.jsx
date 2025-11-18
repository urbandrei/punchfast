import React, { useEffect, useState } from "react";

const BusinessPunches = ({ business }) => {
  const [businessId, setBusinessId] = useState(business?.username || "");
  const [customerUsername, setCustomerUsername] = useState("");
  const [status, setStatus] = useState("");
  const [punches, setPunches] = useState(null);
  const [remaining, setRemaining] = useState(null);

  const [goal, setGoal] = useState(10);
  const [reward, setReward] = useState("");
  const [rewardMessage, setRewardMessage] = useState("");

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

  useEffect(() => {
    if (!businessId) return;

    try {
      const key = `pf_business_settings_${businessId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed.goal === "number" && parsed.goal > 0) {
          setGoal(parsed.goal);
        } else {
          setGoal(10);
        }
        if (typeof parsed.reward === "string") {
          setReward(parsed.reward);
        } else {
          setReward("");
        }
      } else {
        setGoal(10);
        setReward("");
      }
    } catch (e) {
      console.error("Error reading business settings:", e);
      setGoal(10);
      setReward("");
    }
  }, [businessId]);

  // update daily / monthly / lifetime stats + top customers (this month)
  const updateStatsAfterPunch = (bizId, customer) => {
    if (!bizId || !customer) return;

    try {
      const key = `pf_business_stats_${bizId}`;
      const stored = localStorage.getItem(key);
      let stats = stored ? JSON.parse(stored) : {};

      const now = new Date();
      const todayKey = now.toISOString().slice(0, 10); // YYYY-MM-DD
      const monthKey = todayKey.slice(0, 7); // YYYY-MM

      if (stats.dailyDate !== todayKey) {
        stats.dailyDate = todayKey;
        stats.dailyTotal = 0;
      }

      if (stats.monthKey !== monthKey) {
        stats.monthKey = monthKey;
        stats.monthlyTotal = 0;
        stats.monthlyCustomers = {};
      }

      stats.dailyTotal = (stats.dailyTotal || 0) + 1;
      stats.monthlyTotal = (stats.monthlyTotal || 0) + 1;
      stats.lifetimeTotal = (stats.lifetimeTotal || 0) + 1;

      if (!stats.monthlyCustomers) {
        stats.monthlyCustomers = {};
      }

      const trimmed = customer.trim();
      if (trimmed) {
        const currentCount = stats.monthlyCustomers[trimmed] || 0;
        stats.monthlyCustomers[trimmed] = currentCount + 1;
      }

      localStorage.setItem(key, JSON.stringify(stats));
    } catch (e) {
      console.error("Error updating business stats:", e);
    }
  };

  async function handleRegister(e) {
    e.preventDefault();
    setStatus("");
    setPunches(null);
    setRemaining(null);
    setRewardMessage("");

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

      // total punches from backend (lifetime)
      const lifetimePunches =
        typeof data.punches === "number" ? data.punches : null;

      const rawGoal =
        typeof goal === "number" ? goal : parseInt(goal, 10);
      const effectiveGoal =
        Number.isNaN(rawGoal) || rawGoal <= 0 ? 1 : rawGoal;

      let displayPunches = lifetimePunches;
      let displayRemaining = null;
      let shouldReward = false;

      if (lifetimePunches != null) {
        const mod = lifetimePunches % effectiveGoal;

        if (mod === 0 && lifetimePunches > 0) {
          // Just hit a multiple of the goal:
          // show reward and reset progress toward next reward
          displayPunches = 0;
          displayRemaining = effectiveGoal;
          shouldReward = true;
        } else {
          // Progress within current punchcard cycle
          displayPunches = mod;
          displayRemaining = effectiveGoal - mod;
        }
      }

      setStatus(data.message || "Punch recorded.");
      setPunches(displayPunches);
      setRemaining(displayRemaining);

      if (shouldReward) {
        const rewardText = (reward && reward.trim()) || "a reward";
        setRewardMessage(
          `Goal reached! ${customerUsername.trim()} is now eligible for ${rewardText}.`
        );
      } else {
        setRewardMessage("");
      }

      // update local stats (daily/monthly/top customers)
      updateStatsAfterPunch(effectiveBusinessId, customerUsername);
    } catch (err) {
      console.error(err);
      setStatus("Network error");
    }
  }

  const headerBusinessLabel =
    businessId || (business && business.username) || "Business";

  return (
    <div className="container py-4">
      <div
        className="d-flex justify-content-between align-items-center mb-3"
        style={{ gap: "12px" }}
      >
        <h2 className="mb-0" style={{ color: "#302C9A" }}>
          Punchfast Business Portal
        </h2>
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

              {rewardMessage && (
                <div className="alert alert-success mt-3">
                  {rewardMessage}
                </div>
              )}

              {punches !== null && (
                <div className="mt-2">
                  <p className="mb-1">
                    <b>{customerUsername}</b> now has <b>{punches}</b> punch
                    {punches === 1 ? "" : "es"} toward the next reward.
                  </p>
                  {remaining !== null && (
                    <p className="text-muted mb-0">
                      Remaining to goal ({goal}): <b>{remaining}</b>
                    </p>
                  )}
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
