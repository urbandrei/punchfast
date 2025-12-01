import '../index.css';

const SkeletonCard = ({ type = 'store' }) => {
  if (type === 'route') {
    return (
      <div className="skeleton-card route-type">
        {/* Header with title and button placeholder */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <div className="skeleton-shimmer skeleton-header" style={{ width: '50%' }}></div>
          <div className="skeleton-shimmer" style={{ width: '100px', height: '36px', borderRadius: '20px' }}></div>
        </div>

        {/* Path section with circles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
            <div className="skeleton-shimmer" style={{ position: 'absolute', left: 0, right: 0, height: '3px' }}></div>
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="skeleton-shimmer"
                style={{ width: '16px', height: '16px', borderRadius: '50%', position: 'relative', zIndex: 2 }}
              ></div>
            ))}
          </div>
          <div className="skeleton-shimmer" style={{ width: '20px', height: '20px' }}></div>
        </div>
      </div>
    );
  }

  // Store type skeleton
  return (
    <div className="skeleton-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <div className="skeleton-shimmer skeleton-header" style={{ width: '70%', marginBottom: '10px' }}></div>
          <div className="skeleton-shimmer skeleton-text short"></div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div className="skeleton-shimmer skeleton-icon"></div>
          <div className="skeleton-shimmer skeleton-icon"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
