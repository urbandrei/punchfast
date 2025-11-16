import React from 'react';

const BusinessDashboard = ({ business }) => {
  const username = business?.username || 'Business';

  return (
    <div className="container" style={{ marginTop: '40px' }}>
      <div className="mb-4">
        <h2 style={{ color: '#302C9A' }}>
          {username} – Business Dashboard
        </h2>
        <p style={{ color: '#6AB7AD', marginBottom: 0 }}>
          Here you&apos;ll see your punchcard stats, customers, and offer
          settings. We&apos;ll wire the real data and layout in the next steps.
        </p>
      </div>

      <div className="card shadow-sm" style={{ borderRadius: '12px', padding: '20px' }}>
        <p style={{ marginBottom: 0 }}>
          Placeholder dashboard content. We&apos;ll replace this with the
          full design you described.
        </p>
      </div>
    </div>
  );
};

export default BusinessDashboard;
