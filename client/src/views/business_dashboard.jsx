import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const BusinessDashboard = ({ business }) => {
  const [goal, setGoal] = useState(business?.goal || 10);
  const [rewardText, setRewardText] = useState(business?.rewardText || 'Free item on goal');
  const [offerLoading, setOfferLoading] = useState(false);
  const [offerMessage, setOfferMessage] = useState('');

  
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalPunches: 0,
    completedCards: 0,
    todayPunches: 0
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');

  const username = business?.username;

  useEffect(() => {
    if (!username) return;

    const fetchOffer = async () => {
      try {
        setOfferLoading(true);
        setOfferMessage('');
        const res = await fetch(`/api/business-offer?username=${encodeURIComponent(username)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (typeof data.goal !== 'undefined') setGoal(data.goal);
        if (typeof data.rewardText !== 'undefined') setRewardText(data.rewardText);
      } catch (err) {
        console.error('Error fetching business offer:', err);
      } finally {
        setOfferLoading(false);
      }
    };

    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        setStatsError('');
      
        const res = await fetch(`/api/business/stats?username=${encodeURIComponent(username)}`);
        if (!res.ok) {
          setStatsError('Could not load stats');
          return;
        }
        const data = await res.json();
        setStats({
          totalCustomers: data.totalCustomers ?? 0,
          totalPunches: data.totalPunches ?? 0,
          completedCards: data.completedCards ?? 0,
          todayPunches: data.todayPunches ?? 0
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
        setStatsError('Could not load stats');
      } finally {
        setStatsLoading(false);
      }
    };

    fetchOffer();
    fetchStats();
  }, [username]);

  if (!business) {
    return (
      <div className="container" style={{ marginTop: '40px' }}>
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '2px solid #A7CCDE'
          }}
        >
          <h2 style={{ color: '#302C9A', marginBottom: '16px' }}>Business Dashboard</h2>
          <p style={{ color: '#6AB7AD', marginBottom: '0' }}>
            Please sign in as a business to view your dashboard.
          </p>
        </div>
      </div>
    );
  }

  const handleOfferSubmit = async (e) => {
    e.preventDefault();
    setOfferMessage('');
    setOfferLoading(true);

    try {
      const res = await fetch('/api/business-offer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          goal,
          rewardText
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setOfferMessage(data.message || 'Failed to update offer');
      } else {
        setOfferMessage('Offer updated successfully!');
      }
    } catch (err) {
      console.error('Error updating offer:', err);
      setOfferMessage('Failed to update offer');
    } finally {
      setOfferLoading(false);
      setTimeout(() => setOfferMessage(''), 3000);
    }
  };

  return (
    <div className="container" style={{ marginTop: '40px', marginBottom: '40px' }}>
      {/* Header with Punches link */}
      <div
        className="d-flex justify-content-between align-items-center mb-4"
        style={{ gap: '12px' }}
      >
        <div>
          <h2 style={{ color: '#302C9A', margin: 0 }}>Business Dashboard</h2>
          <p style={{ color: '#6AB7AD', margin: 0, fontSize: '0.95em' }}>
            Signed in as <strong>{username}</strong>
          </p>
        </div>

        <Link
          to="/business"
          className="btn btn-primary"
          style={{
            borderRadius: '25px',
            padding: '8px 20px',
            fontWeight: 500
          }}
        >
          Punches
        </Link>
      </div>

      {/* Stats section */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div
            className="card shadow-sm h-100"
            style={{ borderRadius: '12px', padding: '16px' }}
          >
            <div style={{ fontSize: '0.9em', color: '#6AB7AD' }}>Total Customers</div>
            <div style={{ fontSize: '1.6em', fontWeight: '600', color: '#302C9A' }}>
              {statsLoading ? '…' : stats.totalCustomers}
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div
            className="card shadow-sm h-100"
            style={{ borderRadius: '12px', padding: '16px' }}
          >
            <div style={{ fontSize: '0.9em', color: '#6AB7AD' }}>Total Punches</div>
            <div style={{ fontSize: '1.6em', fontWeight: '600', color: '#302C9A' }}>
              {statsLoading ? '…' : stats.totalPunches}
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div
            className="card shadow-sm h-100"
            style={{ borderRadius: '12px', padding: '16px' }}
          >
            <div style={{ fontSize: '0.9em', color: '#6AB7AD' }}>Completed Cards</div>
            <div style={{ fontSize: '1.6em', fontWeight: '600', color: '#302C9A' }}>
              {statsLoading ? '…' : stats.completedCards}
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div
            className="card shadow-sm h-100"
            style={{ borderRadius: '12px', padding: '16px' }}
          >
            <div style={{ fontSize: '0.9em', color: '#6AB7AD' }}>Punches Today</div>
            <div style={{ fontSize: '1.6em', fontWeight: '600', color: '#302C9A' }}>
              {statsLoading ? '…' : stats.todayPunches}
            </div>
          </div>
        </div>
      </div>

      {statsError && (
        <div
          className="alert"
          style={{
            backgroundColor: 'rgba(230, 142, 141, 0.1)',
            border: '1px solid #E68E8D',
            color: '#E68E8D',
            borderRadius: '8px',
            fontSize: '0.9em'
          }}
        >
          {statsError}
        </div>
      )}

      {/* Offer config */}
      <div className="card shadow-sm" style={{ borderRadius: '12px', padding: '20px' }}>
        <h4 style={{ color: '#302C9A', marginBottom: '16px' }}>Offer Settings</h4>
        <p style={{ color: '#6AB7AD', fontSize: '0.95em' }}>
          Configure how many punches are needed for a reward and what the reward is.
        </p>

        <form onSubmit={handleOfferSubmit}>
          <div className="row g-3">
            <div className="col-12 col-md-4">
              <label
                htmlFor="goal"
                className="form-label"
                style={{ color: '#302C9A', fontWeight: 500 }}
              >
                Punches to goal
              </label>
              <input
                id="goal"
                type="number"
                min="1"
                max="50"
                className="form-control"
                value={goal}
                onChange={(e) => setGoal(Number(e.target.value) || 1)}
                disabled={offerLoading}
                style={{ borderColor: '#A7CCDE', borderRadius: '8px' }}
                onFocus={(e) => (e.target.style.borderColor = '#6AB7AD')}
                onBlur={(e) => (e.target.style.borderColor = '#A7CCDE')}
              />
            </div>

            <div className="col-12 col-md-8">
              <label
                htmlFor="rewardText"
                className="form-label"
                style={{ color: '#302C9A', fontWeight: 500 }}
              >
                Reward description
              </label>
              <input
                id="rewardText"
                type="text"
                maxLength={140}
                className="form-control"
                value={rewardText}
                onChange={(e) => setRewardText(e.target.value)}
                disabled={offerLoading}
                style={{ borderColor: '#A7CCDE', borderRadius: '8px' }}
                onFocus={(e) => (e.target.style.borderColor = '#6AB7AD')}
                onBlur={(e) => (e.target.style.borderColor = '#A7CCDE')}
                placeholder="e.g. Free coffee or 20% off order"
              />
            </div>
          </div>

          <div className="d-flex justify-content-end mt-3">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={offerLoading}
              style={{ borderRadius: '8px', padding: '10px 20px', fontWeight: 500 }}
            >
              {offerLoading ? 'Saving…' : 'Save Offer'}
            </button>
          </div>

          {offerMessage && (
            <div
              className="mt-3"
              style={{
                color: offerMessage.includes('successfully') ? '#2d7a6e' : '#E68E8D',
                fontSize: '0.9em'
              }}
            >
              {offerMessage}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default BusinessDashboard;
