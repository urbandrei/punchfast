import React from 'react';
import useMorphAnimation from '../hooks/useMorphAnimation';

/**
 * MorphingCard - Wrapper component that adds morphing background animation
 *
 * @param {string} variant - 'card' | 'modal' | 'button' - styling variant
 * @param {boolean} enabled - Whether morphing animation is active (default: true)
 * @param {string} className - Additional CSS classes for the wrapper
 * @param {Object} style - Additional inline styles
 * @param {React.ReactNode} children - Content to wrap
 * @param {function} onClick - Click handler
 */
const MorphingCard = ({
  variant = 'card',
  enabled = true,
  className = '',
  style = {},
  children,
  onClick,
  ...props
}) => {
  const { ref } = useMorphAnimation({ enabled });

  const variantClass = {
    card: 'pf-morphing-card',
    modal: 'pf-morphing-card pf-morphing-modal',
    button: 'pf-morphing-card pf-morphing-button'
  }[variant] || 'pf-morphing-card';

  return (
    <div
      ref={ref}
      className={`${variantClass} ${className}`}
      style={style}
      onClick={onClick}
      {...props}
    >
      {/* Two background layers for the morphing effect */}
      <div className="pf-morph-bg pf-morph-bg-1" />
      <div className="pf-morph-bg pf-morph-bg-2" />

      {/* Content wrapper to ensure proper z-index */}
      <div className="pf-morph-content">
        {children}
      </div>
    </div>
  );
};

export default MorphingCard;
