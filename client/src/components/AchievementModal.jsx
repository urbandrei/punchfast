import React from 'react';

const AchievementModal = ({ show, achievement, onClose }) => {
    if (!show || !achievement) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
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
            onClick={handleOverlayClick}
        >
            <div
                style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '30px',
                    maxWidth: '500px',
                    width: '90%',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                    textAlign: 'center'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>
                    🎉
                </div>
                <h2 style={{
                    color: '#302C9A',
                    fontSize: '1.75rem',
                    fontWeight: '600',
                    marginBottom: '15px'
                }}>
                    Achievement Unlocked!
                </h2>
                <h3 style={{
                    color: '#6AB7AD',
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    marginBottom: '10px'
                }}>
                    {achievement.name}
                </h3>
                <p style={{
                    color: '#555',
                    fontSize: '1rem',
                    marginBottom: '25px',
                    lineHeight: '1.5'
                }}>
                    {achievement.description}
                </p>
                <button
                    onClick={onClose}
                    style={{
                        backgroundColor: '#6AB7AD',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px 30px',
                        fontSize: '1rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s, transform 0.1s',
                        width: '100%',
                        maxWidth: '200px'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#5aa69d';
                        e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#6AB7AD';
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    Awesome!
                </button>
            </div>
        </div>
    );
};

export default AchievementModal;
