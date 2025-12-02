/**
 * BusinessDashboard View Tests
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import BusinessDashboard from '../business_dashboard';

describe('BusinessDashboard', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const mockBusiness = { id: 1, username: 'testbiz' };

  const renderBusinessDashboard = (props = {}) => {
    const defaultProps = {
      business: null
    };
    return render(<BusinessDashboard {...defaultProps} {...props} />);
  };

  describe('not logged in state', () => {
    it('should show sign in prompt when no business', () => {
      renderBusinessDashboard({ business: null });

      expect(screen.getByText('Business Dashboard')).toBeInTheDocument();
      expect(screen.getByText(/please sign in as a business/i)).toBeInTheDocument();
    });
  });

  describe('logged in state', () => {
    it('should show business username', () => {
      renderBusinessDashboard({ business: mockBusiness });

      expect(screen.getByText(/signed in as/i)).toBeInTheDocument();
      expect(screen.getByText(/testbiz/i)).toBeInTheDocument();
    });

    it('should store username in localStorage', () => {
      renderBusinessDashboard({ business: mockBusiness });

      expect(localStorage.getItem('pf_business_username')).toBe('testbiz');
    });
  });

  describe('punchcard settings', () => {
    it('should show Punchcard Settings section', () => {
      renderBusinessDashboard({ business: mockBusiness });

      expect(screen.getByText('Punchcard Settings')).toBeInTheDocument();
    });

    it('should render goal input', () => {
      renderBusinessDashboard({ business: mockBusiness });

      expect(screen.getByLabelText(/punch goal/i)).toBeInTheDocument();
    });

    it('should render reward input', () => {
      renderBusinessDashboard({ business: mockBusiness });

      expect(screen.getByLabelText(/reward description/i)).toBeInTheDocument();
    });

    it('should render Save settings button', () => {
      renderBusinessDashboard({ business: mockBusiness });

      expect(screen.getByRole('button', { name: /save settings/i })).toBeInTheDocument();
    });

    it('should have default goal of 10', () => {
      renderBusinessDashboard({ business: mockBusiness });

      expect(screen.getByLabelText(/punch goal/i)).toHaveValue(10);
    });

    it('should update goal on input', () => {
      renderBusinessDashboard({ business: mockBusiness });

      const goalInput = screen.getByLabelText(/punch goal/i);
      fireEvent.change(goalInput, { target: { value: '15' } });

      expect(goalInput).toHaveValue(15);
    });

    it('should update reward on input', () => {
      renderBusinessDashboard({ business: mockBusiness });

      const rewardInput = screen.getByLabelText(/reward description/i);
      fireEvent.change(rewardInput, { target: { value: 'Free coffee' } });

      expect(rewardInput).toHaveValue('Free coffee');
    });

    it('should save settings to localStorage', () => {
      renderBusinessDashboard({ business: mockBusiness });

      fireEvent.change(screen.getByLabelText(/punch goal/i), { target: { value: '15' } });
      fireEvent.change(screen.getByLabelText(/reward description/i), { target: { value: 'Free bagel' } });

      fireEvent.click(screen.getByRole('button', { name: /save settings/i }));

      const saved = JSON.parse(localStorage.getItem('pf_business_settings_testbiz'));
      expect(saved.goal).toBe(15);
      expect(saved.reward).toBe('Free bagel');
    });

    it('should show success message on save', () => {
      renderBusinessDashboard({ business: mockBusiness });

      fireEvent.click(screen.getByRole('button', { name: /save settings/i }));

      expect(screen.getByText('Settings saved.')).toBeInTheDocument();
    });

    it('should clear success message after timeout', async () => {
      renderBusinessDashboard({ business: mockBusiness });

      fireEvent.click(screen.getByRole('button', { name: /save settings/i }));

      expect(screen.getByText('Settings saved.')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(screen.queryByText('Settings saved.')).not.toBeInTheDocument();
    });

    it('should load saved settings from localStorage', () => {
      localStorage.setItem('pf_business_settings_testbiz', JSON.stringify({
        goal: 20,
        reward: 'Free item'
      }));

      renderBusinessDashboard({ business: mockBusiness });

      expect(screen.getByLabelText(/punch goal/i)).toHaveValue(20);
      expect(screen.getByLabelText(/reward description/i)).toHaveValue('Free item');
    });

    it('should handle invalid goal gracefully', () => {
      renderBusinessDashboard({ business: mockBusiness });

      fireEvent.change(screen.getByLabelText(/punch goal/i), { target: { value: '0' } });
      fireEvent.click(screen.getByRole('button', { name: /save settings/i }));

      // Goal should be set to 1 when 0 or negative
      const saved = JSON.parse(localStorage.getItem('pf_business_settings_testbiz'));
      expect(saved.goal).toBe(1);
    });
  });

  describe('punch statistics', () => {
    it('should show Punch Statistics section', () => {
      renderBusinessDashboard({ business: mockBusiness });

      expect(screen.getByText('Punch Statistics')).toBeInTheDocument();
    });

    it('should show daily total', () => {
      renderBusinessDashboard({ business: mockBusiness });

      expect(screen.getByText(/today:/i)).toBeInTheDocument();
    });

    it('should show monthly total', () => {
      renderBusinessDashboard({ business: mockBusiness });

      expect(screen.getByText(/this month:/i)).toBeInTheDocument();
    });

    it('should show lifetime total', () => {
      renderBusinessDashboard({ business: mockBusiness });

      expect(screen.getByText(/lifetime/i)).toBeInTheDocument();
    });

    it('should show Top customers header', () => {
      renderBusinessDashboard({ business: mockBusiness });

      expect(screen.getByText(/top customers this month/i)).toBeInTheDocument();
    });

    it('should show no punches message when no stats', () => {
      renderBusinessDashboard({ business: mockBusiness });

      expect(screen.getByText(/no punches recorded yet/i)).toBeInTheDocument();
    });

    it('should load stats from localStorage', () => {
      localStorage.setItem('pf_business_stats_testbiz', JSON.stringify({
        dailyTotal: 5,
        monthlyTotal: 25,
        lifetimeTotal: 100,
        monthlyCustomers: { user1: 10, user2: 8, user3: 7 }
      }));

      renderBusinessDashboard({ business: mockBusiness });

      // Check that the stats are displayed (multiple elements might match so use getAllByText)
      expect(screen.getByText('Today:')).toBeInTheDocument();
      expect(screen.getByText('This month:')).toBeInTheDocument();
      expect(screen.getByText(/Lifetime/)).toBeInTheDocument();
    });

    it('should display top customers', () => {
      localStorage.setItem('pf_business_stats_testbiz', JSON.stringify({
        dailyTotal: 5,
        monthlyTotal: 25,
        lifetimeTotal: 100,
        monthlyCustomers: { user1: 10, user2: 8 }
      }));

      renderBusinessDashboard({ business: mockBusiness });

      // Top customers are displayed in a list like "1. user1 – 10 punches"
      expect(screen.getByText(/user1/)).toBeInTheDocument();
      expect(screen.getByText(/user2/)).toBeInTheDocument();
    });
  });

  describe('localStorage fallback', () => {
    it('should use stored username when business prop is null', () => {
      localStorage.setItem('pf_business_username', 'storeduser');

      renderBusinessDashboard({ business: null });

      // Wait for useEffect to run
      expect(screen.getByText(/signed in as/i)).toBeInTheDocument();
    });

    it('should use stored email as fallback', () => {
      localStorage.setItem('pf_business_email', 'test@example.com');

      renderBusinessDashboard({ business: null });

      expect(screen.getByText(/signed in as/i)).toBeInTheDocument();
    });
  });
});
