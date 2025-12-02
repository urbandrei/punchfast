import React, { useRef } from 'react';

// Counter for unique IDs
let waveIdCounter = 0;

/**
 * WaveDecoration - Animated SVG wave decoration component
 *
 * @param {string} position - 'top' or 'bottom' - where the wave appears
 * @param {string} baseColor - 'navbar' | 'filter' | 'tabs' | 'cards' - color scheme
 * @param {string} className - additional CSS classes
 */
const WaveDecoration = ({ position = 'bottom', baseColor = 'cards', className = '' }) => {
  // Generate unique ID for SVG path to prevent conflicts when multiple waves exist
  const idRef = useRef(null);
  if (idRef.current === null) {
    idRef.current = ++waveIdCounter;
  }
  const pathId = `wave-path-${idRef.current}`;

  // Color configurations for different contexts
  const colorConfigs = {
    navbar: {
      layers: [
        'rgba(167,204,222,0.7)',
        'rgba(167,204,222,0.5)',
        'rgba(167,204,222,0.3)',
        '#A7CCDE'
      ]
    },
    cards: {
      layers: [
        'rgba(167,204,222,0.7)',
        'rgba(167,204,222,0.5)',
        'rgba(167,204,222,0.3)',
        '#A7CCDE'
      ]
    },
    filter: {
      layers: [
        'rgba(248,249,250,0.7)',
        'rgba(248,249,250,0.5)',
        'rgba(248,249,250,0.3)',
        '#f8f9fa'
      ]
    },
    tabs: {
      layers: [
        'rgba(48,44,154,0.7)',
        'rgba(48,44,154,0.5)',
        'rgba(48,44,154,0.3)',
        '#302C9A'
      ]
    }
  };

  const colors = colorConfigs[baseColor] || colorConfigs.cards;
  const positionClass = position === 'top' ? 'position-top' : 'position-bottom';

  return (
    <svg
      className={`pf-waves ${positionClass} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox="0 24 150 28"
      preserveAspectRatio="none"
      shapeRendering="auto"
    >
      <defs>
        <path
          id={pathId}
          d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z"
        />
      </defs>
      <g className="parallax">
        <use xlinkHref={`#${pathId}`} x="48" y="0" fill={colors.layers[0]} />
        <use xlinkHref={`#${pathId}`} x="48" y="3" fill={colors.layers[1]} />
        <use xlinkHref={`#${pathId}`} x="48" y="5" fill={colors.layers[2]} />
        <use xlinkHref={`#${pathId}`} x="48" y="7" fill={colors.layers[3]} />
      </g>
    </svg>
  );
};

export default WaveDecoration;
