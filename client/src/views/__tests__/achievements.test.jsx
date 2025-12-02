/**
 * Achievements View Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Achievements from '../achievements';

// Mock AchievementCard component
jest.mock('../../components/AchievementCard', () => {
  return function MockAchievementCard({ name, description, unlocked }) {
    return (
      <div data-testid="achievement-card">
        <span>{name}</span>
        <span>{description}</span>
        <span>{unlocked ? 'Unlocked' : 'Locked'}</span>
      </div>
    );
  };
});

describe('Achievements', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const mockUser = { id: 1, username: 'testuser' };

  const renderAchievements = (props = {}) => {
    const defaultProps = {
      isLogin: false,
      user: null,
      onShowAuth: jest.fn()
    };
    return render(<Achievements {...defaultProps} {...props} />);
  };

  describe('logged out state', () => {
    it('should show sign in prompt when not logged in', () => {
      renderAchievements({ isLogin: false, user: null });

      expect(screen.getByText('Achievements')).toBeInTheDocument();
      expect(screen.getByText(/sign in to view your achievements/i)).toBeInTheDocument();
    });

    it('should show trophy emoji', () => {
      renderAchievements({ isLogin: false, user: null });

      expect(screen.getByText('🏆')).toBeInTheDocument();
    });

    it('should show Sign In button when not logged in', () => {
      renderAchievements({ isLogin: false, user: null });

      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should call onShowAuth when Sign In clicked', () => {
      const onShowAuth = jest.fn();
      renderAchievements({ isLogin: false, user: null, onShowAuth });

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      expect(onShowAuth).toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('should show loading message while fetching', () => {
      global.fetch.mockImplementation(() => new Promise(() => {}));

      renderAchievements({ isLogin: true, user: mockUser });

      expect(screen.getByText(/loading achievements/i)).toBeInTheDocument();
    });
  });

  describe('logged in state', () => {
    it('should show page title', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ achievements: [] })
      });

      renderAchievements({ isLogin: true, user: mockUser });

      await waitFor(() => {
        expect(screen.getByText('Achievements')).toBeInTheDocument();
      });
    });

    it('should show progress subtitle', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ achievements: [] })
      });

      renderAchievements({ isLogin: true, user: mockUser });

      await waitFor(() => {
        expect(screen.getByText(/track your progress/i)).toBeInTheDocument();
      });
    });
  });

  describe('empty state', () => {
    it('should show no achievements message when empty', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ achievements: [] })
      });

      renderAchievements({ isLogin: true, user: mockUser });

      await waitFor(() => {
        expect(screen.getByText(/no achievements available/i)).toBeInTheDocument();
      });
    });
  });

  describe('with achievements', () => {
    const mockAchievements = [
      {
        id: 1,
        name: 'First Visit',
        description: 'Visit your first store',
        unlocked: true,
        unlockedAt: '2024-01-15T10:00:00Z',
        type: 'visits'
      },
      {
        id: 2,
        name: 'Route Master',
        description: 'Complete 5 routes',
        unlocked: false,
        unlockedAt: null,
        type: 'routes'
      }
    ];

    beforeEach(() => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ achievements: mockAchievements })
      });
    });

    it('should render achievement cards', async () => {
      renderAchievements({ isLogin: true, user: mockUser });

      await waitFor(() => {
        const cards = screen.getAllByTestId('achievement-card');
        expect(cards).toHaveLength(2);
      });
    });

    it('should display achievement names', async () => {
      renderAchievements({ isLogin: true, user: mockUser });

      await waitFor(() => {
        expect(screen.getByText('First Visit')).toBeInTheDocument();
        expect(screen.getByText('Route Master')).toBeInTheDocument();
      });
    });

    it('should display unlocked status', async () => {
      renderAchievements({ isLogin: true, user: mockUser });

      await waitFor(() => {
        expect(screen.getByText('Unlocked')).toBeInTheDocument();
        expect(screen.getByText('Locked')).toBeInTheDocument();
      });
    });
  });

  describe('API calls', () => {
    it('should fetch achievements with user id', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ achievements: [] })
      });

      renderAchievements({ isLogin: true, user: mockUser });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/achievements/all-with-progress/1');
      });
    });

    it('should not fetch when not logged in', () => {
      renderAchievements({ isLogin: false, user: null });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle fetch error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      renderAchievements({ isLogin: true, user: mockUser });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });
});
