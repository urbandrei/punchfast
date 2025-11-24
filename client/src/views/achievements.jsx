import React, { useEffect, useState } from "react";

export default function Achievements() {
  const [achievements, setAchievements] = useState([]);
  const userId = 1; // ⚠️ Replace with logged-in user ID

  useEffect(() => {
    fetch(`/api/achievements/user/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setAchievements(data.achievements || []);
      })
      .catch((err) => {
        console.error("Error fetching achievements:", err);
      });
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
        Achievements
      </h1>

      {achievements.length === 0 ? (
        <p style={{ textAlign: "center", color: "gray" }}>
          No achievements unlocked yet.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
          }}
        >
          {achievements.map((ach) => (
            <div
              key={ach.id}
              style={{
                background: "white",
                padding: "20px",
                borderRadius: "16px",
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "48px" }}>🏅</div>
              <h2 style={{ marginTop: "10px" }}>{ach.name}</h2>
              <p style={{ color: "#555" }}>{ach.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
