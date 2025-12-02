/**
 * AchievementModal Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import AchievementModal from '../AchievementModal';

describe('AchievementModal', () => {
  const defaultAchievement = {
    name: 'First Visit',
    description: 'Visit your first store'
  };

  const defaultProps = {
    show: true,
    achievement: defaultAchievement,
    onClose: jest.fn()
  };

  const renderModal = (props = {}) => {
    return render(<AchievementModal {...defaultProps} {...props} />);
  };

  describe('visibility', () => {
    it('should not render when show is false', () => {
      renderModal({ show: false });

      expect(screen.queryByText('Achievement Unlocked!')).not.toBeInTheDocument();
    });

    it('should not render when achievement is null', () => {
      renderModal({ achievement: null });

      expect(screen.queryByText('Achievement Unlocked!')).not.toBeInTheDocument();
    });

    it('should render when show is true and achievement is provided', () => {
      renderModal();

      expect(screen.getByText('Achievement Unlocked!')).toBeInTheDocument();
    });
  });

  describe('content display', () => {
    it('should show celebration emoji', () => {
      renderModal();

      expect(screen.getByText('🎉')).toBeInTheDocument();
    });

    it('should show "Achievement Unlocked!" title', () => {
      renderModal();

      expect(screen.getByText('Achievement Unlocked!')).toBeInTheDocument();
    });

    it('should show achievement name', () => {
      renderModal();

      expect(screen.getByText('First Visit')).toBeInTheDocument();
    });

    it('should show achievement description', () => {
      renderModal();

      expect(screen.getByText('Visit your first store')).toBeInTheDocument();
    });

    it('should show "Awesome!" button', () => {
      renderModal();

      expect(screen.getByRole('button', { name: /awesome/i })).toBeInTheDocument();
    });
  });

  describe('different achievements', () => {
    it('should display route achievement', () => {
      const routeAchievement = {
        name: 'Route Master',
        description: 'Complete 10 routes'
      };

      renderModal({ achievement: routeAchievement });

      expect(screen.getByText('Route Master')).toBeInTheDocument();
      expect(screen.getByText('Complete 10 routes')).toBeInTheDocument();
    });

    it('should display questionnaire achievement', () => {
      const questionAchievement = {
        name: 'Helpful Helper',
        description: 'Answer 5 questions'
      };

      renderModal({ achievement: questionAchievement });

      expect(screen.getByText('Helpful Helper')).toBeInTheDocument();
      expect(screen.getByText('Answer 5 questions')).toBeInTheDocument();
    });
  });

  describe('close interactions', () => {
    it('should call onClose when Awesome button is clicked', () => {
      const onClose = jest.fn();
      renderModal({ onClose });

      fireEvent.click(screen.getByRole('button', { name: /awesome/i }));

      expect(onClose).toHaveBeenCalled();
    });

    it('should call onClose when clicking overlay', () => {
      const onClose = jest.fn();
      const { container } = renderModal({ onClose });

      // Click on the overlay (first child which is the backdrop)
      const overlay = container.firstChild;
      fireEvent.click(overlay);

      expect(onClose).toHaveBeenCalled();
    });

    it('should not call onClose when clicking modal content', () => {
      const onClose = jest.fn();
      renderModal({ onClose });

      // Click on the achievement name (inside modal content)
      const achievementName = screen.getByText('First Visit');
      fireEvent.click(achievementName);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('button interactions', () => {
    it('should change style on hover', () => {
      renderModal();

      const button = screen.getByRole('button', { name: /awesome/i });

      fireEvent.mouseEnter(button);
      expect(button.style.backgroundColor).toBe('rgb(90, 166, 157)');
      expect(button.style.transform).toBe('scale(1.02)');

      fireEvent.mouseLeave(button);
      expect(button.style.backgroundColor).toBe('rgb(106, 183, 173)');
      expect(button.style.transform).toBe('scale(1)');
    });
  });
});
