import React from 'react';

const AchievementCard = ({ name, description, unlocked, unlockedAt, type }) => {
    const getAchievementEmoji = (type, unlocked) => {
        if (!unlocked) return '🔒';

        switch (type) {
            case 'visits':
                return '👣';
            case 'routes_started':
                return '🗺️';
            case 'routes_completed':
                return '🏆';
            case 'first_save':
            case 'total_saves':
                return '❤️';
            default:
                return '🏅';
        }
    };

    const cardStyle = unlocked ? {
        backgroundColor: 'white',
        border: '1px solid #dee2e6',
        boxShadow: '0 2px 8px rgba(48, 44, 154, 0.1)',
        borderRadius: '12px',
        padding: '20px',
        textAlign: 'center',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'default'
    } : {
        backgroundColor: '#f0f0f0',
        filter: 'grayscale(100%)',
        opacity: 0.6,
        border: '1px solid #ddd',
        boxShadow: '0 2px 8px rgba(48, 44, 154, 0.05)',
        borderRadius: '12px',
        padding: '20px',
        textAlign: 'center',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'default'
    };

    const handleMouseEnter = (e) => {
        if (unlocked) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(48, 44, 154, 0.15)';
        }
    };

    const handleMouseLeave = (e) => {
        if (unlocked) {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(48, 44, 154, 0.1)';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div
            style={cardStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>
                {getAchievementEmoji(type, unlocked)}
            </div>
            <h3 style={{
                marginTop: '10px',
                marginBottom: '8px',
                color: unlocked ? '#302C9A' : '#666',
                fontSize: '1.1rem',
                fontWeight: '600'
            }}>
                {unlocked ? name : '???'}
            </h3>
            <p style={{
                color: unlocked ? '#555' : '#888',
                fontSize: '0.9rem',
                marginBottom: unlockedAt ? '10px' : '0'
            }}>
                {unlocked ? description : 'Locked - Keep exploring!'}
            </p>
            {unlocked && unlockedAt && (
                <p style={{
                    fontSize: '0.75rem',
                    color: '#6AB7AD',
                    fontStyle: 'italic',
                    marginTop: '10px',
                    marginBottom: '0'
                }}>
                    Unlocked {formatDate(unlockedAt)}
                </p>
            )}
        </div>
    );
};

export default AchievementCard;
