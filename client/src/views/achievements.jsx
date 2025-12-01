import React, { useEffect, useState } from "react";
import AchievementCard from "../components/AchievementCard";

export default function Achievements({ isLogin, user, onShowAuth }) {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLogin || !user?.id) {
      setLoading(false);
      return;
    }

    fetch(`/api/achievements/all-with-progress/${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        setAchievements(data.achievements || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching achievements:", err);
        setLoading(false);
      });
  }, [isLogin, user?.id]);

  if (!isLogin || !user) {
    return (
      <div style={{
        padding: "40px 20px",
        textAlign: "center",
        maxWidth: "600px",
        margin: "0 auto"
      }}>
        <div style={{ fontSize: "64px", marginBottom: "20px" }}>🏆</div>
        <h1 style={{
          color: "#302C9A",
          marginBottom: "15px"
        }}>
          Achievements
        </h1>
        <p style={{
          color: "#555",
          fontSize: "1.1rem",
          marginBottom: "25px"
        }}>
          Sign in to view your achievements and track your progress!
        </p>
        <button
          onClick={onShowAuth}
          style={{
            backgroundColor: "#6AB7AD",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "12px 30px",
            fontSize: "1rem",
            fontWeight: "500",
            cursor: "pointer",
            transition: "background-color 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#5aa69d"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#6AB7AD"}
        >
          Sign In
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        padding: "40px 20px",
        textAlign: "center"
      }}>
        <p style={{ color: "#555" }}>Loading achievements...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{
        textAlign: "center",
        marginBottom: "10px",
        color: "#302C9A"
      }}>
        Achievements
      </h1>
      <p style={{
        textAlign: "center",
        color: "#555",
        marginBottom: "30px"
      }}>
        Track your progress and unlock new achievements!
      </p>

      {achievements.length === 0 ? (
        <p style={{ textAlign: "center", color: "gray" }}>
          No achievements available yet.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
            maxWidth: "1200px",
            margin: "0 auto"
          }}
        >
          {achievements.map((ach) => (
            <AchievementCard
              key={ach.id}
              name={ach.name}
              description={ach.description}
              unlocked={ach.unlocked}
              unlockedAt={ach.unlockedAt}
              type={ach.type}
            />
          ))}
        </div>
      )}
    </div>
  );
}
