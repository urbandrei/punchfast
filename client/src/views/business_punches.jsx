import React from 'react';
import { Link } from 'react-router-dom';

const BusinessPunches = ({ business }) => {
  const username = business?.username || 'Business';

  return (
    <div className="container" style={{ marginTop: '40px' }}>
      <div
        className="d-flex justify-content-between align-items-center mb-4"
        style={{ gap: '12px' }}
      >
        <h2 style={{ color: '#302C9A', margin: 0 }}>
          Punches for {username}
        </h2>

        <Link
          to="/business/dashboard"
          className="btn btn-primary"
          style={{
            borderRadius: '25px',
            padding: '8px 20px',
            fontWeight: 500
          }}
        >
          Dashboard
        </Link>
      </div>

      <div
        className="card shadow-sm"
        style={{ borderRadius: '12px', padding: '20px' }}
      >
        <p style={{ marginBottom: 0 }}>
          This is the Business Punches page. We will plug in the exact
          punches layout from Keerthan's branch here.
        </p>
      </div>
    </div>
  );
};

export default BusinessPunches;
