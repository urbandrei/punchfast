import React, { useEffect, useState } from "react";
import MorphingCard from "../components/MorphingCard";

const BusinessDashboard = ({ business }) => {
  const [businessId, setBusinessId] = useState(business?.username || "");

  const [goal, setGoal] = useState(10);
  const [reward, setReward] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const [stats, setStats] = useState({
    dailyTotal: 0,
    monthlyTotal: 0,
    lifetimeTotal: 0,
    topCustomers: [],
  });

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
    if (!businessId) {
      return;
    }

    // settings
    try {
      const settingsKey = `pf_business_settings_${businessId}`;
      const storedSettings = localStorage.getItem(settingsKey);
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
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

    // stats
    try {
      const statsKey = `pf_business_stats_${businessId}`;
      const storedStats = localStorage.getItem(statsKey);
      if (storedStats) {
        const parsedStats = JSON.parse(storedStats);
        const monthlyCustomers = parsedStats.monthlyCustomers || {};
        const topCustomersArray = Object.entries(monthlyCustomers)
          .sort((a, b) => (b[1] || 0) - (a[1] || 0))
          .slice(0, 5)
          .map(([username, count]) => ({
            username,
            count: count || 0,
          }));

        setStats({
          dailyTotal: parsedStats.dailyTotal || 0,
          monthlyTotal: parsedStats.monthlyTotal || 0,
          lifetimeTotal: parsedStats.lifetimeTotal || 0,
          topCustomers: topCustomersArray,
        });
      } else {
        setStats({
          dailyTotal: 0,
          monthlyTotal: 0,
          lifetimeTotal: 0,
          topCustomers: [],
        });
      }
    } catch (e) {
      console.error("Error reading business stats:", e);
      setStats({
        dailyTotal: 0,
        monthlyTotal: 0,
        lifetimeTotal: 0,
        topCustomers: [],
      });
    }
  }, [businessId]);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    if (!businessId) return;

    const parsedGoal = parseInt(goal, 10);
    const finalGoal =
      Number.isNaN(parsedGoal) || parsedGoal <= 0 ? 1 : parsedGoal;
    const trimmedReward = reward ? reward.trim() : "";

    const settings = {
      goal: finalGoal,
      reward: trimmedReward,
    };

    try {
      localStorage.setItem(
        `pf_business_settings_${businessId}`,
        JSON.stringify(settings)
      );
      setGoal(finalGoal);
      setReward(trimmedReward);
      setSaveMessage("Settings saved.");
      setTimeout(() => {
        setSaveMessage("");
      }, 3000);
    } catch (e) {
      console.error("Error saving business settings:", e);
      setSaveMessage("Could not save settings.");
    }
  };

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
          maxWidth: "900px",
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
          {/* Punchcard settings */}
          <div className="col-12 col-md-6">
            <MorphingCard
              className="p-3 h-100"
              style={{
                borderRadius: "12px",
              }}
            >
              <h5 style={{ color: "#302C9A" }} className="mb-2">
                Punchcard Settings
              </h5>
              <p className="text-muted" style={{ fontSize: "0.9rem" }}>
                Choose how many punches are needed and what customers receive
                when they reach the goal.
              </p>
              <form onSubmit={handleSaveSettings}>
                <div className="mb-3">
                  <label
                    htmlFor="goal-input"
                    className="form-label"
                    style={{ fontWeight: "500" }}
                  >
                    Punch goal (number of punches)
                  </label>
                  <input
                    id="goal-input"
                    type="number"
                    min="1"
                    className="form-control"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label
                    htmlFor="reward-input"
                    className="form-label"
                    style={{ fontWeight: "500" }}
                  >
                    Reward description
                  </label>
                  <input
                    id="reward-input"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Free coffee, free bagel"
                    value={reward}
                    onChange={(e) => setReward(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  Save settings
                </button>
                {saveMessage && (
                  <div
                    style={{
                      marginTop: "8px",
                      fontSize: "0.85rem",
                      color:
                        saveMessage === "Settings saved."
                          ? "#28a745"
                          : "#E68E8D",
                    }}
                  >
                    {saveMessage}
                  </div>
                )}
              </form>
            </MorphingCard>
          </div>

          {/* Punch statistics */}
          <div className="col-12 col-md-6">
            <MorphingCard
              className="p-3 h-100"
              style={{
                borderRadius: "12px",
              }}
            >
              <h5 style={{ color: "#302C9A" }} className="mb-2">
                Punch Statistics
              </h5>
              <p className="text-muted" style={{ fontSize: "0.9rem" }}>
                Totals are based on punches registered from this browser for
                this business.
              </p>

              <ul className="list-unstyled mb-3" style={{ fontSize: "0.9rem" }}>
                <li>
                  <b>Today:</b> {stats.dailyTotal} punch
                  {stats.dailyTotal === 1 ? "" : "es"}
                </li>
                <li>
                  <b>This month:</b> {stats.monthlyTotal} punch
                  {stats.monthlyTotal === 1 ? "" : "es"}
                </li>
                <li>
                  <b>Lifetime (this browser):</b> {stats.lifetimeTotal} punch
                  {stats.lifetimeTotal === 1 ? "" : "es"}
                </li>
              </ul>

              <h6 style={{ color: "#302C9A" }} className="mb-1">
                Top customers this month
              </h6>
              {stats.topCustomers.length === 0 ? (
                <p className="text-muted" style={{ fontSize: "0.9rem" }}>
                  No punches recorded yet this month.
                </p>
              ) : (
                <ul
                  className="list-unstyled mb-0"
                  style={{ fontSize: "0.9rem" }}
                >
                  {stats.topCustomers.map((cust, index) => (
                    <li key={cust.username}>
                      <b>{index + 1}.</b> {cust.username} –{" "}
                      <b>{cust.count}</b> punch
                      {cust.count === 1 ? "" : "es"}
                    </li>
                  ))}
                </ul>
              )}
            </MorphingCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboard;
