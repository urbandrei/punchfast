/**
 * AchievementCard Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import AchievementCard from '../AchievementCard';

describe('AchievementCard', () => {
  const defaultProps = {
    name: 'First Visit',
    description: 'Visit your first store',
    type: 'visits',
    unlocked: false,
    unlockedAt: null
  };

  describe('locked state', () => {
    it('should show "???" instead of name when locked', () => {
      render(<AchievementCard {...defaultProps} />);

      expect(screen.getByText('???')).toBeInTheDocument();
      expect(screen.queryByText('First Visit')).not.toBeInTheDocument();
    });

    it('should show "Locked - Keep exploring!" when locked', () => {
      render(<AchievementCard {...defaultProps} />);

      expect(screen.getByText('Locked - Keep exploring!')).toBeInTheDocument();
    });

    it('should show lock emoji when locked', () => {
      render(<AchievementCard {...defaultProps} />);

      expect(screen.getByText('🔒')).toBeInTheDocument();
    });

    it('should not show unlock date when locked', () => {
      render(<AchievementCard {...defaultProps} unlockedAt="2024-01-15T10:30:00Z" />);

      expect(screen.queryByText(/Unlocked/)).not.toBeInTheDocument();
    });

    it('should have grayscale filter when locked', () => {
      const { container } = render(<AchievementCard {...defaultProps} />);

      const card = container.firstChild;
      expect(card).toHaveStyle({ filter: 'grayscale(100%)' });
    });

    it('should have reduced opacity when locked', () => {
      const { container } = render(<AchievementCard {...defaultProps} />);

      const card = container.firstChild;
      expect(card).toHaveStyle({ opacity: '0.6' });
    });
  });

  describe('unlocked state', () => {
    it('should show name when unlocked', () => {
      render(<AchievementCard {...defaultProps} unlocked={true} />);

      expect(screen.getByText('First Visit')).toBeInTheDocument();
      expect(screen.queryByText('???')).not.toBeInTheDocument();
    });

    it('should show description when unlocked', () => {
      render(<AchievementCard {...defaultProps} unlocked={true} />);

      expect(screen.getByText('Visit your first store')).toBeInTheDocument();
    });

    it('should not have grayscale filter when unlocked', () => {
      const { container } = render(<AchievementCard {...defaultProps} unlocked={true} />);

      const card = container.firstChild;
      expect(card).not.toHaveStyle({ filter: 'grayscale(100%)' });
    });

    it('should have full opacity when unlocked', () => {
      const { container } = render(<AchievementCard {...defaultProps} unlocked={true} />);

      const card = container.firstChild;
      expect(card).not.toHaveStyle({ opacity: '0.6' });
    });
  });

  describe('unlock date', () => {
    it('should show formatted unlock date when provided and unlocked', () => {
      render(
        <AchievementCard
          {...defaultProps}
          unlocked={true}
          unlockedAt="2024-01-15T10:30:00Z"
        />
      );

      expect(screen.getByText(/Unlocked/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
    });

    it('should not show unlock date when not unlocked even if date provided', () => {
      render(
        <AchievementCard
          {...defaultProps}
          unlocked={false}
          unlockedAt="2024-01-15T10:30:00Z"
        />
      );

      expect(screen.queryByText(/Unlocked/)).not.toBeInTheDocument();
    });

    it('should not show unlock date section when unlockedAt is null', () => {
      render(<AchievementCard {...defaultProps} unlocked={true} unlockedAt={null} />);

      expect(screen.queryByText(/Unlocked/)).not.toBeInTheDocument();
    });
  });

  describe('achievement type emojis', () => {
    it('should show footprints emoji for visits type', () => {
      render(<AchievementCard {...defaultProps} unlocked={true} type="visits" />);

      expect(screen.getByText('👣')).toBeInTheDocument();
    });

    it('should show map emoji for routes_started type', () => {
      render(<AchievementCard {...defaultProps} unlocked={true} type="routes_started" />);

      expect(screen.getByText('🗺️')).toBeInTheDocument();
    });

    it('should show trophy emoji for routes_completed type', () => {
      render(<AchievementCard {...defaultProps} unlocked={true} type="routes_completed" />);

      expect(screen.getByText('🏆')).toBeInTheDocument();
    });

    it('should show heart emoji for first_save type', () => {
      render(<AchievementCard {...defaultProps} unlocked={true} type="first_save" />);

      expect(screen.getByText('❤️')).toBeInTheDocument();
    });

    it('should show heart emoji for total_saves type', () => {
      render(<AchievementCard {...defaultProps} unlocked={true} type="total_saves" />);

      expect(screen.getByText('❤️')).toBeInTheDocument();
    });

    it('should show medal emoji for unknown types', () => {
      render(<AchievementCard {...defaultProps} unlocked={true} type="unknown_type" />);

      expect(screen.getByText('🏅')).toBeInTheDocument();
    });
  });

  describe('hover interactions', () => {
    it('should change style on mouse enter when unlocked', () => {
      const { container } = render(<AchievementCard {...defaultProps} unlocked={true} />);

      const card = container.firstChild;
      fireEvent.mouseEnter(card);

      expect(card.style.transform).toBe('translateY(-2px)');
    });

    it('should reset style on mouse leave when unlocked', () => {
      const { container } = render(<AchievementCard {...defaultProps} unlocked={true} />);

      const card = container.firstChild;
      fireEvent.mouseEnter(card);
      fireEvent.mouseLeave(card);

      expect(card.style.transform).toBe('translateY(0)');
    });

    it('should not change style on mouse enter when locked', () => {
      const { container } = render(<AchievementCard {...defaultProps} unlocked={false} />);

      const card = container.firstChild;
      const initialTransform = card.style.transform;
      fireEvent.mouseEnter(card);

      expect(card.style.transform).toBe(initialTransform);
    });
  });
});
