import React, { useState } from 'react';
import MorphingCard from './MorphingCard';

const QuestionnaireModal = ({ show, userId, storeId, storeName, question, onSubmit, onSkip, onClose }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!show || !question) {
    return null;
  }

  const handleOptionSelect = (optionValue) => {
    setSelectedOption(optionValue);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!selectedOption) {
      setError('Please select an option');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/questionnaire/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          storeId,
          fieldName: question.fieldName,
          suggestedValue: selectedOption,
          skipped: false
        })
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Failed to submit answer. Please try again.');
        setIsSubmitting(false);
        return;
      }

      const data = await res.json();

      if (onSubmit) {
        onSubmit(data.unlockedAchievements || []);
      }

      setSelectedOption(null);
      setError(null);
      setIsSubmitting(false);
      onClose();

    } catch (err) {
      console.error('Error submitting answer:', err);
      setError('Failed to submit answer. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/questionnaire/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          storeId,
          fieldName: question.fieldName,
          suggestedValue: null,
          skipped: true
        })
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Failed to skip question. Please try again.');
        setIsSubmitting(false);
        return;
      }

      if (onSkip) {
        onSkip();
      }

      setSelectedOption(null);
      setError(null);
      setIsSubmitting(false);
      onClose();

    } catch (err) {
      console.error('Error skipping question:', err);
      setError('Failed to skip question. Please try again.');
      setIsSubmitting(false);
    }
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
      onClick={(e) => e.stopPropagation()}
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
            ?
          </span>
        </div>

        <h2 style={{ color: '#302C9A', marginTop: 0, marginBottom: '20px', textAlign: 'center' }}>
          Quick Question
        </h2>

        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '0.9em', color: '#6AB7AD', marginBottom: '15px', textAlign: 'center' }}>
            About {storeName}
          </p>
          <p style={{ fontSize: '1.05em', color: '#302C9A', marginBottom: '20px', textAlign: 'center', fontWeight: '500' }}>
            {question.questionText}
          </p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          {question.options && question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleOptionSelect(option.value)}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '14px 20px',
                marginBottom: '10px',
                backgroundColor: selectedOption === option.value ? '#302C9A' : 'white',
                color: selectedOption === option.value ? 'white' : '#302C9A',
                border: '2px solid #302C9A',
                borderRadius: '10px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                fontSize: '1em',
                transition: 'all 0.2s',
                opacity: isSubmitting ? 0.5 : 1
              }}
              onMouseOver={(e) => {
                if (!isSubmitting && selectedOption !== option.value) {
                  e.target.style.backgroundColor = '#E8F4F8';
                }
              }}
              onMouseOut={(e) => {
                if (!isSubmitting && selectedOption !== option.value) {
                  e.target.style.backgroundColor = 'white';
                }
              }}
            >
              {option.label}
            </button>
          ))}
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
            onClick={handleSkip}
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
            Skip
          </button>
          <button
            onClick={handleSubmit}
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
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </MorphingCard>
    </div>
  );
};

export default QuestionnaireModal;
