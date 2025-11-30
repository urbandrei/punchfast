import React, { useState, useEffect } from 'react';
import '../index.css';

const StoreCard = ({
  storeId,
  storeName,
  latitude,
  longitude,
  isSelected = false,
  onCardClick,
  userId,
  onShowAuth
}) => {
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [visitStats, setVisitStats] = useState({ totalVisits: 0, visitedToday: false });

  useEffect(() => {
    const fetchData = async () => {
      if (!userId || !storeId) return;

      try {
        const savedRes = await fetch(`/api/saved-stores/${userId}/${storeId}`);
        if (savedRes.ok) {
          const savedData = await savedRes.json();
          setIsSaved(savedData.saved);
        }

        const statsRes = await fetch(`/api/visits/store-stats?userId=${userId}&storeId=${storeId}`);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setVisitStats(statsData);
        }
      } catch (err) {
        console.error('Error fetching store data:', err);
      }
    };

    fetchData();
  }, [userId, storeId]);

  const handleToggleSave = async () => {
    if (!userId) {
      if (onShowAuth) {
        onShowAuth();
      }
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/saved-stores/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, storeId })
      });

      if (res.ok) {
        const data = await res.json();
        setIsSaved(data.saved);
      } else {
        console.error('Failed to toggle save status');
      }
    } catch (err) {
      console.error('Error toggling save:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="store-card-container"
      onClick={onCardClick}
      style={{
        cursor: 'pointer',
        border: isSelected ? '3px solid #FF5722' : '1px solid #dee2e6',
        backgroundColor: isSelected ? '#fff5f3' : 'white',
        transition: 'all 0.2s'
      }}
    >
      <div className="store-card-content">
        <div className="store-card-main">
          <span className="store-card-name">{storeName}</span>
          {userId && (
            <div className="store-card-visit-info">
              <span className="store-card-visit-count">
                {visitStats.totalVisits} {visitStats.totalVisits === 1 ? 'visit' : 'visits'}
              </span>
              {visitStats.visitedToday && (
                <span className="store-card-visited-today">✓ Visited today</span>
              )}
            </div>
          )}
        </div>
        <div className="store-card-icons">
          {latitude && longitude && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="store-card-map-icon"
              title="View on Google Maps"
            >
              📍
            </a>
          )}
          <button
            className="store-card-save-icon"
            onClick={handleToggleSave}
            disabled={isLoading}
            title={isSaved ? 'Unsave store' : 'Save store'}
          >
            {isSaved ? '❤️' : '🤍'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoreCard;
