import React, { useState } from 'react';
import { markVisitedToday, addVisitDenial } from '../utils/proximityUtils';
import MorphingCard from './MorphingCard';

const VisitNotificationModal = ({ show, stores, userId, onVisit, onNotVisiting, onClose, onQuestionnaireTriggered }) => {
  const [selectedStoreIds, setSelectedStoreIds] = useState([]);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!show || !stores || stores.length === 0) {
    return null;
  }

  const isSingleStore = stores.length === 1;

  const handleCheckboxChange = (storeId) => {
    setSelectedStoreIds(prev => {
      if (prev.includes(storeId)) {
        return prev.filter(id => id !== storeId);
      } else {
        return [...prev, storeId];
      }
    });
    setError(null);
  };

  const handleVisit = async () => {
    if (!isSingleStore && selectedStoreIds.length === 0) {
      setError('Please select at least one store to visit');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const storeIdsToVisit = isSingleStore ? [stores[0].id] : selectedStoreIds;

      const visitPromises = storeIdsToVisit.map(storeId =>
        fetch('/api/visits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            storeId,
            visitDate: new Date().toISOString()
          })
        })
      );

      const results = await Promise.all(visitPromises);
      const failedVisits = results.filter(res => !res.ok);

      if (failedVisits.length > 0) {
        setError('Some visits could not be recorded. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Check for questionnaire triggers
      const jsonResults = await Promise.all(results.map(res => res.json()));
      const triggeredVisit = jsonResults.find(data => data.shouldShowQuestionnaire);

      // Mark as visited today locally
      storeIdsToVisit.forEach(storeId => markVisitedToday(storeId));

      if (onVisit) {
        onVisit(storeIdsToVisit);
      }

      setSelectedStoreIds([]);
      setError(null);
      setIsSubmitting(false);
      onClose();

      // Show questionnaire modal if triggered
      if (triggeredVisit && onQuestionnaireTriggered) {
        onQuestionnaireTriggered(triggeredVisit.visit);
      }

    } catch (err) {
      console.error('Error recording visit:', err);
      setError('Failed to record visit. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleNotVisiting = () => {
    const storeIds = stores.map(s => s.id);

    // Add 1-hour denial for each store
    storeIds.forEach(storeId => addVisitDenial(storeId));

    if (onNotVisiting) {
      onNotVisiting(storeIds);
    }
    setSelectedStoreIds([]);
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
      onClick={handleNotVisiting}
    >
      <MorphingCard
        variant="modal"
        style={{
          borderRadius: '12px',
          padding: '30px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ color: '#302C9A', marginTop: 0, marginBottom: '20px' }}>
          {isSingleStore ? 'Store Nearby!' : 'Multiple Stores Nearby!'}
        </h2>

        {isSingleStore ? (
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '1.1em', color: '#302C9A', marginBottom: '10px' }}>
              You're near <strong>{stores[0].name}</strong>
            </p>
            {stores[0].address && (
              <p style={{ color: '#6AB7AD', fontSize: '0.9em', marginBottom: '10px' }}>
                {stores[0].address}
              </p>
            )}
            <p style={{ color: '#666', fontSize: '0.95em' }}>
              Would you like to record a visit?
            </p>
          </div>
        ) : (
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '1em', color: '#302C9A', marginBottom: '15px' }}>
              You're near {stores.length} stores. Select which ones you're visiting:
            </p>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {stores.map(store => (
                <div
                  key={store.id}
                  style={{
                    padding: '12px',
                    marginBottom: '10px',
                    border: '2px solid #A7CCDE',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: selectedStoreIds.includes(store.id) ? '#E8F4F8' : 'white',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => handleCheckboxChange(store.id)}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      margin: 0
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedStoreIds.includes(store.id)}
                      onChange={() => handleCheckboxChange(store.id)}
                      style={{
                        marginRight: '10px',
                        cursor: 'pointer',
                        width: '18px',
                        height: '18px'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#302C9A', fontWeight: '500', marginBottom: '4px' }}>
                        {store.name}
                      </div>
                      {store.address && (
                        <div style={{ color: '#6AB7AD', fontSize: '0.85em' }}>
                          {store.address}
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

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

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={handleNotVisiting}
            disabled={isSubmitting}
            style={{
              padding: '10px 20px',
              backgroundColor: '#E68E8D',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              opacity: isSubmitting ? 0.5 : 1,
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => !isSubmitting && (e.target.style.opacity = '0.8')}
            onMouseOut={(e) => !isSubmitting && (e.target.style.opacity = '1')}
          >
            Not Visiting
          </button>
          <button
            onClick={handleVisit}
            disabled={isSubmitting}
            style={{
              padding: '10px 20px',
              backgroundColor: '#302C9A',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              opacity: isSubmitting ? 0.5 : 1,
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => !isSubmitting && (e.target.style.backgroundColor = '#6AB7AD')}
            onMouseOut={(e) => !isSubmitting && (e.target.style.backgroundColor = '#302C9A')}
          >
            {isSubmitting ? 'Recording...' : 'Visit'}
          </button>
        </div>
      </MorphingCard>
    </div>
  );
};

export default VisitNotificationModal;
