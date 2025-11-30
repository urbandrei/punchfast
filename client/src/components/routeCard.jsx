import React, { useState, useEffect } from 'react';
import '../index.css';

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const O1 = lat1 * Math.PI / 180;
  const O2 = lat2 * Math.PI / 180;
  const del_lat = (lat2 - lat1) * Math.PI / 180;
  const del_lon = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(del_lat / 2) * Math.sin(del_lat / 2) + Math.cos(O1) * Math.cos(O2) * Math.sin(del_lon / 2) * Math.sin(del_lon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const RouteCard = ({
  routeId,
  routeName = "Test Route",
  isActive = false,
  isSelected = false,
  onJoinClick,
  onLeaveClick,
  onCardClick,
  stores = [],
  userId,
  onShowAuth
}) => {
  const [showStores, setShowStores] = useState(false);
  const [savedStoresMap, setSavedStoresMap] = useState({});
  const [visitedStoreIds, setVisitedStoreIds] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [orderedStores, setOrderedStores] = useState([]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;

      const savedMap = {};
      await Promise.all(
        stores.map(async (store) => {
          try {
            const res = await fetch(`/api/saved-stores/${userId}/${store.id}`);
            if (res.ok) {
              const data = await res.json();
              savedMap[store.id] = data.saved;
            }
          } catch (err) {
            console.error('Error checking saved status:', err);
          }
        })
      );
      setSavedStoresMap(savedMap);

      if (routeId) {
        try {
          const res = await fetch(`/api/visits/route-progress?userId=${userId}&routeId=${routeId}`);
          if (res.ok) {
            const data = await res.json();
            setVisitedStoreIds(data.visitedStoreIds || []);
          }
        } catch (err) {
          console.error('Error fetching route progress:', err);
        }
      }
    };

    fetchData();
  }, [userId, stores, routeId]);

  useEffect(() => {
    if (!stores || stores.length === 0) {
      setOrderedStores([]);
      return;
    }

    const visited = stores.filter(store => visitedStoreIds.includes(store.id));
    const notVisited = stores.filter(store => !visitedStoreIds.includes(store.id));

    if (userLocation && notVisited.length > 0) {
      notVisited.sort((a, b) => {
        if (!a.latitude || !a.longitude) return 1;
        if (!b.latitude || !b.longitude) return -1;

        const distA = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          parseFloat(a.latitude),
          parseFloat(a.longitude)
        );
        const distB = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          parseFloat(b.latitude),
          parseFloat(b.longitude)
        );

        return distA - distB;
      });
    }

    setOrderedStores([...visited, ...notVisited]);
  }, [stores, visitedStoreIds, userLocation]);

  const handleButtonClick = () => {
    if (isActive) {
      onLeaveClick();
    } else {
      onJoinClick();
    }
  };

  const handleToggleSave = async (storeId, e) => {
    e.stopPropagation();

    if (!userId) {
      if (onShowAuth) {
        onShowAuth();
      }
      return;
    }

    try {
      const res = await fetch('/api/saved-stores/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, storeId })
      });

      if (res.ok) {
        const data = await res.json();
        setSavedStoresMap(prev => ({
          ...prev,
          [storeId]: data.saved
        }));
      }
    } catch (err) {
      console.error('Error toggling save:', err);
    }
  };

  const displayStores = orderedStores.length > 0 ? orderedStores : stores;
  const visitedCount = visitedStoreIds.length;

  return (
    <div
      className="route-card-container"
      onClick={onCardClick}
      style={{
        cursor: 'pointer',
        border: isSelected ? '3px solid #FF5722' : '1px solid #dee2e6',
        backgroundColor: isSelected ? '#fff5f3' : 'white',
        transition: 'all 0.2s'
      }}
    >
      <div className="route-card-header">
        <h2 className="route-card-title">{routeName}</h2>
        <button
          className="route-card-join-button"
          onClick={handleButtonClick}
          style={isActive ? { backgroundColor: '#dc3545' } : {}}
        >
          {isActive ? 'Leave Route' : 'Join Route'}
        </button>
      </div>

      <div className="route-card-path-section">
        <div className="route-card-path">
          <div className="route-card-horizontal-line"></div>
          <div
            className="route-card-horizontal-line-filled"
            style={{
              width: visitedCount > 0
                ? `${((visitedCount - 0.5) / stores.length) * 100}%`
                : '0%'
            }}
          ></div>
          {stores.map((store, index) => {
            const isVisited = visitedStoreIds.includes(store.id);
            return (
              <div
                key={store.id || index}
                className={`route-card-path-circle ${isVisited ? 'visited' : ''}`}
                title={store.name}
              ></div>
            );
          })}
        </div>
        <div
          className="route-card-dropdown-arrow"
          onClick={() => setShowStores(!showStores)}
        >
          {showStores ? '▲' : '▼'}
        </div>
      </div>

      {showStores && displayStores.length > 0 && (
        <div className="route-card-stores-list">
          <div className="route-card-stores-wrapper">
            {displayStores.map((store, index) => {
              const isVisited = visitedStoreIds.includes(store.id);
              return (
                <div
                  key={store.id}
                  className={`route-card-store-item ${isVisited ? 'visited' : ''}`}
                >
                  <div className="store-left-section">
                    <div className={`store-list-circle ${isVisited ? 'visited' : ''}`}></div>
                    <span className="store-name">{store.name}</span>
                  </div>
                  <div className="store-icons">
                    {store.latitude && store.longitude && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="store-map-icon"
                        title="View on Google Maps"
                      >
                        📍
                      </a>
                    )}
                    <button
                      className="store-save-icon"
                      onClick={(e) => handleToggleSave(store.id, e)}
                      title={savedStoresMap[store.id] ? 'Unsave store' : 'Save store'}
                    >
                      {savedStoresMap[store.id] ? '❤️' : '🤍'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteCard;
