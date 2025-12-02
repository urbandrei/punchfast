import React, { useState, useEffect } from 'react';
import MorphingCard from './MorphingCard';

const PunchNotificationModal = ({ show, store, userId, onPunch, onNotPunching, onClose }) => {
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [businessInfo, setBusinessInfo] = useState(null);

  useEffect(() => {
    const fetchBusinessInfo = async () => {
      if (store && store.id) {
        try {
          const res = await fetch(`/api/stores/${store.id}/verification`);
          if (res.ok) {
            const data = await res.json();
            setBusinessInfo(data.business);
          }
        } catch (err) {
          console.error('Error fetching business info:', err);
        }
      }
    };

    if (show) {
      fetchBusinessInfo();
    }
  }, [show, store]);

  if (!show || !store) {
    return null;
  }

  const handlePunch = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/punch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          storeId: store.id
        })
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Failed to punch card. Please try again.');
        setIsSubmitting(false);
        return;
      }

      if (onPunch) {
        onPunch(store.id);
      }

      setError(null);
      setIsSubmitting(false);
      onClose();

    } catch (err) {
      console.error('Error punching card:', err);
      setError('Failed to punch card. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleNotPunching = () => {
    if (onNotPunching) {
      onNotPunching(store.id);
    }
    setError(null);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
      onClick={handleNotPunching}
    >
      <MorphingCard
        variant="modal"
        style={{
          borderRadius: '12px',
          padding: '30px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <span
            style={{
              fontSize: '3em',
              color: '#6AB7AD'
            }}
          >
            ✓
          </span>
        </div>

        <h2 style={{ color: '#302C9A', marginTop: 0, marginBottom: '20px', textAlign: 'center' }}>
          Verified Store Nearby!
        </h2>

        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '1.1em', color: '#302C9A', marginBottom: '10px', textAlign: 'center' }}>
            You're near <strong>{store.name}</strong>
          </p>
          {store.address && (
            <p style={{ color: '#6AB7AD', fontSize: '0.9em', marginBottom: '10px', textAlign: 'center' }}>
              {store.address}
            </p>
          )}
          {businessInfo && (
            <p style={{ color: '#999', fontSize: '0.85em', marginBottom: '15px', textAlign: 'center' }}>
              Verified by @{businessInfo.username}
            </p>
          )}
          <p style={{ color: '#666', fontSize: '0.95em', textAlign: 'center' }}>
            Would you like to punch your card?
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: '#ffe6e6',
              border: '1px solid #E68E8D',
              color: '#c41e3a',
              padding: '10px',
              borderRadius: '6px',
              marginBottom: '15px',
              fontSize: '0.9em'
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={handleNotPunching}
            disabled={isSubmitting}
            style={{
              padding: '12px 24px',
              backgroundColor: '#E68E8D',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              opacity: isSubmitting ? 0.5 : 1,
              transition: 'all 0.2s',
              fontSize: '1em'
            }}
            onMouseOver={(e) => !isSubmitting && (e.target.style.opacity = '0.8')}
            onMouseOut={(e) => !isSubmitting && (e.target.style.opacity = '1')}
          >
            Not Now
          </button>
          <button
            onClick={handlePunch}
            disabled={isSubmitting}
            style={{
              padding: '12px 24px',
              backgroundColor: '#6AB7AD',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              opacity: isSubmitting ? 0.5 : 1,
              transition: 'all 0.2s',
              fontSize: '1em'
            }}
            onMouseOver={(e) => !isSubmitting && (e.target.style.backgroundColor = '#302C9A')}
            onMouseOut={(e) => !isSubmitting && (e.target.style.backgroundColor = '#6AB7AD')}
          >
            {isSubmitting ? 'Punching...' : 'Punch Card'}
          </button>
        </div>
      </MorphingCard>
    </div>
  );
};

export default PunchNotificationModal;
