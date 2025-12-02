/**
 * SkeletonCard Component Tests
 */

import { render } from '@testing-library/react';
import SkeletonCard from '../SkeletonCard';

describe('SkeletonCard', () => {
  describe('store type (default)', () => {
    it('should render store skeleton by default', () => {
      const { container } = render(<SkeletonCard />);

      expect(container.querySelector('.skeleton-card')).toBeInTheDocument();
      expect(container.querySelector('.skeleton-card.route-type')).not.toBeInTheDocument();
    });

    it('should render store skeleton with header', () => {
      const { container } = render(<SkeletonCard type="store" />);

      expect(container.querySelector('.skeleton-header')).toBeInTheDocument();
    });

    it('should render store skeleton with text placeholder', () => {
      const { container } = render(<SkeletonCard type="store" />);

      expect(container.querySelector('.skeleton-text')).toBeInTheDocument();
    });

    it('should render store skeleton with icon placeholders', () => {
      const { container } = render(<SkeletonCard type="store" />);

      const icons = container.querySelectorAll('.skeleton-icon');
      expect(icons.length).toBe(2);
    });

    it('should have shimmer animation class on elements', () => {
      const { container } = render(<SkeletonCard type="store" />);

      const shimmerElements = container.querySelectorAll('.skeleton-shimmer');
      expect(shimmerElements.length).toBeGreaterThan(0);
    });
  });

  describe('route type', () => {
    it('should render route skeleton when type is route', () => {
      const { container } = render(<SkeletonCard type="route" />);

      expect(container.querySelector('.skeleton-card.route-type')).toBeInTheDocument();
    });

    it('should render route skeleton with header', () => {
      const { container } = render(<SkeletonCard type="route" />);

      expect(container.querySelector('.skeleton-header')).toBeInTheDocument();
    });

    it('should render route skeleton with circle placeholders for stores', () => {
      const { container } = render(<SkeletonCard type="route" />);

      // Route skeleton has 5 circle placeholders for store indicators
      const circles = container.querySelectorAll('[style*="border-radius: 50%"]');
      expect(circles.length).toBe(5);
    });

    it('should have shimmer animation class on route elements', () => {
      const { container } = render(<SkeletonCard type="route" />);

      const shimmerElements = container.querySelectorAll('.skeleton-shimmer');
      expect(shimmerElements.length).toBeGreaterThan(0);
    });
  });
});
