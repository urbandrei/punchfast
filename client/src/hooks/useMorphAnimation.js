import { useEffect, useRef, useCallback } from 'react';

/**
 * useMorphAnimation - Custom hook for morphing card animation
 *
 * Creates smooth, continuous animation using requestAnimationFrame
 * Each element gets a random phase offset for async movement
 *
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether animation is active (default: true)
 * @param {number} options.speed - Animation speed multiplier (default: 1)
 * @param {number} options.radiusRange - Max border-radius variation in px (default: 5)
 * @param {number} options.positionRange - Max position offset in px (default: 2.5)
 * @param {number} options.rotationRange - Max rotation in degrees (default: 0.8)
 *
 * @returns {Object} { ref, phaseOffset }
 */
const useMorphAnimation = (options = {}) => {
  const {
    enabled = true,
    speed = 1,
    radiusRange = 5,
    positionRange = 2.5,
    rotationRange = 0.8
  } = options;

  const elementRef = useRef(null);
  const animationRef = useRef(null);
  const timeRef = useRef(0);
  const phaseOffset = useRef(Math.random() * Math.PI * 2);
  const prefersReducedMotion = useRef(false);

  // Check for reduced motion preference
  useEffect(() => {
    // Guard for test environments without matchMedia
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedMotion.current = mediaQuery.matches;

    const handleChange = (e) => {
      prefersReducedMotion.current = e.matches;
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const animate = useCallback(() => {
    if (!elementRef.current || !enabled || prefersReducedMotion.current) {
      return;
    }

    timeRef.current += 0.015 * speed;
    const t = timeRef.current;
    const offset = phaseOffset.current;

    // Border radius variations
    const r1 = Math.sin(t * 0.7 + offset) * radiusRange * 0.8;
    const r2 = Math.cos(t * 0.9 + offset * 1.3) * radiusRange;
    const r3 = Math.sin(t * 0.8 + offset * 0.7) * radiusRange * 0.8;
    const r4 = Math.cos(t * 0.6 + offset * 1.1) * radiusRange;

    // Position offsets
    const pos1 = Math.sin(t * 0.5 + offset * 0.9) * positionRange;
    const pos2 = Math.cos(t * 0.55 + offset * 1.2) * positionRange;

    // Rotation
    const rot1 = Math.sin(t * 0.4 + offset) * rotationRange;
    const rot2 = Math.cos(t * 0.45 + offset * 0.8) * rotationRange;

    // Apply CSS custom properties to the element
    const el = elementRef.current;
    el.style.setProperty('--morph-r1', `${r1}px`);
    el.style.setProperty('--morph-r2', `${r2}px`);
    el.style.setProperty('--morph-r3', `${r3}px`);
    el.style.setProperty('--morph-r4', `${r4}px`);
    el.style.setProperty('--morph-pos1', `${pos1}px`);
    el.style.setProperty('--morph-pos2', `${pos2}px`);
    el.style.setProperty('--morph-rot1', `${rot1}deg`);
    el.style.setProperty('--morph-rot2', `${rot2}deg`);

    animationRef.current = requestAnimationFrame(animate);
  }, [enabled, speed, radiusRange, positionRange, rotationRange]);

  useEffect(() => {
    // Guard for test environments without requestAnimationFrame
    if (typeof requestAnimationFrame === 'undefined') {
      return;
    }

    if (enabled && !prefersReducedMotion.current) {
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current && typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate, enabled]);

  return {
    ref: elementRef,
    phaseOffset: phaseOffset.current
  };
};

export default useMorphAnimation;
