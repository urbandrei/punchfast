import { useState, useEffect } from 'react';
import '../index.css';

const MapControls = ({
  currentLat,
  currentLng,
  userLat,
  userLng,
  onCoordinateChange,
  onReturnToUser,
  onSearchArea,
  hasUserLocation,
  mapHasMoved
}) => {
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(() => {
    const saved = localStorage.getItem('mapControlsMinimized');
    return saved === 'true';
  });

  // Update inputs when currentLat/currentLng props change
  useEffect(() => {
    if (currentLat != null && currentLng != null) {
      setLatInput(currentLat.toFixed(6));
      setLngInput(currentLng.toFixed(6));
    }
  }, [currentLat, currentLng]);

  const handleToggleMinimize = () => {
    const newMinimized = !isMinimized;
    setIsMinimized(newMinimized);
    localStorage.setItem('mapControlsMinimized', String(newMinimized));
  };

  const handleApplyCoordinates = () => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);

    // Validate coordinates
    if (isNaN(lat) || isNaN(lng)) {
      alert('Please enter valid numbers for latitude and longitude');
      return;
    }

    if (lat < -90 || lat > 90) {
      alert('Latitude must be between -90 and 90');
      return;
    }

    if (lng < -180 || lng > 180) {
      alert('Longitude must be between -180 and 180');
      return;
    }

    onCoordinateChange(lat, lng);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleApplyCoordinates();
    }
  };

  return (
    <div className="map-controls-container">
      <button
        className="map-controls-minimize-button"
        onClick={handleToggleMinimize}
        title={isMinimized ? 'Show controls' : 'Hide controls'}
      >
        {isMinimized ? '▲' : '▼'}
      </button>

      {!isMinimized && (
        <>
          <div className="map-controls-coord-group">
            <label className="map-controls-label">Latitude</label>
            <input
              type="text"
              className="map-controls-input"
              value={latInput}
              onChange={(e) => setLatInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., 52.520008"
            />
          </div>

          <div className="map-controls-coord-group">
            <label className="map-controls-label">Longitude</label>
            <input
              type="text"
              className="map-controls-input"
              value={lngInput}
              onChange={(e) => setLngInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., 13.404954"
            />
          </div>

          <button
            className="map-controls-button primary"
            onClick={handleApplyCoordinates}
          >
            Update Location
          </button>

          {hasUserLocation && (
            <button
              className="map-controls-button secondary"
              onClick={onReturnToUser}
            >
              Return to My Location
            </button>
          )}

          {mapHasMoved && (
            <button
              className="map-controls-button primary"
              onClick={onSearchArea}
            >
              Search This Area
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default MapControls;
