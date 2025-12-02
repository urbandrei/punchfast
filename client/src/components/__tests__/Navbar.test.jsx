/**
 * Navbar Component Tests
 *
 * Note: Uses manual mock for react-router-dom due to yarn workspaces monorepo
 * module resolution issues.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from '../Navbar';

// Tell Jest to use the manual mock
jest.mock('react-router-dom');

// Mock SVG imports
jest.mock('../../icons/logo.svg', () => ({
  ReactComponent: (props) => <svg data-testid="logo-svg" {...props} />
}));
jest.mock('../../icons/user.svg', () => ({
  ReactComponent: (props) => <svg data-testid="user-svg" {...props} />
}));
jest.mock('../../icons/achievement.svg', () => ({
  ReactComponent: (props) => <svg data-testid="achievement-svg" {...props} />
}));

const renderNavbar = (props = {}) => {
  const defaultProps = {
    isLoggedIn: false,
    currentUser: null,
    business: null,
    onShowAuth: jest.fn(),
    onChangePassword: jest.fn(),
    onSignOut: jest.fn(),
    onBusinessSignOut: jest.fn()
  };

  return render(<Navbar {...defaultProps} {...props} />);
};

describe('Navbar', () => {
  describe('logged out state', () => {
    it('should render Sign In button when not logged in', () => {
      renderNavbar();

      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should call onShowAuth when Sign In clicked', () => {
      const onShowAuth = jest.fn();
      renderNavbar({ onShowAuth });

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      expect(onShowAuth).toHaveBeenCalled();
    });

    it('should not show Dashboard link when not logged in', () => {
      renderNavbar();

      expect(screen.queryByRole('link', { name: /dashboard/i })).not.toBeInTheDocument();
    });
  });

  describe('customer logged in state', () => {
    const loggedInProps = {
      isLoggedIn: true,
      currentUser: { id: 1, username: 'testuser', isAdmin: false }
    };

    it('should show Dashboard link when logged in', () => {
      renderNavbar(loggedInProps);

      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    });

    it('should show Achievements link when logged in', () => {
      renderNavbar(loggedInProps);

      // Achievements link has title="Achievements" but only contains an SVG icon
      expect(screen.getByTitle('Achievements')).toBeInTheDocument();
    });

    it('should show user dropdown button', () => {
      renderNavbar(loggedInProps);

      // User icon button with dropdown arrow
      const dropdownButton = screen.getByTitle(/welcome back/i);
      expect(dropdownButton).toBeInTheDocument();
    });

    it('should not show Sign In button when logged in', () => {
      renderNavbar(loggedInProps);

      expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
    });

    it('should not show Admin link for non-admin users', () => {
      renderNavbar(loggedInProps);

      expect(screen.queryByRole('link', { name: /admin/i })).not.toBeInTheDocument();
    });
  });

  describe('admin user', () => {
    const adminProps = {
      isLoggedIn: true,
      currentUser: { id: 1, username: 'admin', isAdmin: true }
    };

    it('should show Admin link for admin users', () => {
      renderNavbar(adminProps);

      expect(screen.getByRole('link', { name: /admin/i })).toBeInTheDocument();
    });

    it('should link Admin to /admin/dashboard', () => {
      renderNavbar(adminProps);

      const adminLink = screen.getByRole('link', { name: /admin/i });
      expect(adminLink).toHaveAttribute('href', '/admin/dashboard');
    });
  });

  describe('user dropdown menu', () => {
    const loggedInProps = {
      isLoggedIn: true,
      currentUser: { id: 1, username: 'testuser', isAdmin: false }
    };

    it('should show dropdown menu when user icon clicked', () => {
      renderNavbar(loggedInProps);

      const dropdownButton = screen.getByTitle(/welcome back/i);
      fireEvent.click(dropdownButton);

      expect(screen.getByText('Change Password')).toBeInTheDocument();
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });

    it('should call onChangePassword when Change Password clicked', () => {
      const onChangePassword = jest.fn();
      renderNavbar({ ...loggedInProps, onChangePassword });

      fireEvent.click(screen.getByTitle(/welcome back/i));
      fireEvent.click(screen.getByText('Change Password'));

      expect(onChangePassword).toHaveBeenCalled();
    });

    it('should call onSignOut when Sign Out clicked', () => {
      const onSignOut = jest.fn();
      renderNavbar({ ...loggedInProps, onSignOut });

      fireEvent.click(screen.getByTitle(/welcome back/i));
      fireEvent.click(screen.getByText('Sign Out'));

      expect(onSignOut).toHaveBeenCalled();
    });

    it('should close dropdown when clicking backdrop', () => {
      renderNavbar(loggedInProps);

      fireEvent.click(screen.getByTitle(/welcome back/i));
      expect(screen.getByText('Change Password')).toBeInTheDocument();

      // Click the backdrop (overlay div)
      const backdrop = document.querySelector('[style*="position: fixed"]');
      fireEvent.click(backdrop);

      expect(screen.queryByText('Change Password')).not.toBeInTheDocument();
    });
  });

  describe('business logged in state', () => {
    const businessProps = {
      isLoggedIn: false,
      currentUser: null,
      business: { id: 1, username: 'testbiz' }
    };

    it('should show Dashboard button for business users', () => {
      renderNavbar(businessProps);

      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    });

    it('should show Logout button for business users', () => {
      renderNavbar(businessProps);

      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    });

    it('should call onBusinessSignOut when Logout clicked', () => {
      const onBusinessSignOut = jest.fn();
      renderNavbar({ ...businessProps, onBusinessSignOut });

      fireEvent.click(screen.getByRole('button', { name: /logout/i }));

      expect(onBusinessSignOut).toHaveBeenCalled();
    });

    it('should not show customer Dashboard or Achievements', () => {
      renderNavbar(businessProps);

      // Should only have business links, not customer achievements
      expect(screen.queryByTitle(/achievements/i)).not.toBeInTheDocument();
    });
  });

  describe('navigation links', () => {
    it('should have logo linking to home', () => {
      renderNavbar();

      const homeLink = screen.getByTitle('Punchfast');
      expect(homeLink).toHaveAttribute('href', '/');
    });

    it('should have Dashboard link to /dashboard for customers', () => {
      renderNavbar({
        isLoggedIn: true,
        currentUser: { id: 1, username: 'testuser' }
      });

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    });

    it('should have Achievements link to /achievements', () => {
      renderNavbar({
        isLoggedIn: true,
        currentUser: { id: 1, username: 'testuser' }
      });

      // Achievements link has title but only contains SVG icon
      const achievementsLink = screen.getByTitle('Achievements');
      expect(achievementsLink).toHaveAttribute('href', '/achievements');
    });
  });
});
