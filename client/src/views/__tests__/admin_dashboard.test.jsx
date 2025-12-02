/**
 * AdminDashboard View Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminDashboard from '../admin_dashboard';

describe('AdminDashboard', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = jest.fn();
    window.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const mockAdminUser = { id: 1, username: 'admin', isAdmin: true };
  const mockRegularUser = { id: 2, username: 'user', isAdmin: false };

  const renderAdminDashboard = (props = {}) => {
    const defaultProps = {
      isLogin: false,
      user: null,
      onShowAuth: jest.fn()
    };
    return render(<AdminDashboard {...defaultProps} {...props} />);
  };

  describe('access control', () => {
    it('should show access denied when not logged in', () => {
      renderAdminDashboard({ isLogin: false, user: null });

      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      expect(screen.getByText(/access denied/i)).toBeInTheDocument();
    });

    it('should show access denied for non-admin users', () => {
      renderAdminDashboard({ isLogin: true, user: mockRegularUser });

      expect(screen.getByText(/access denied/i)).toBeInTheDocument();
      expect(screen.getByText(/must be signed in as an administrator/i)).toBeInTheDocument();
    });

    it('should show Sign In button for non-admin users', () => {
      renderAdminDashboard({ isLogin: true, user: mockRegularUser });

      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should call onShowAuth when Sign In clicked', () => {
      const onShowAuth = jest.fn();
      renderAdminDashboard({ isLogin: false, user: null, onShowAuth });

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      expect(onShowAuth).toHaveBeenCalled();
    });
  });

  describe('admin dashboard content', () => {
    beforeEach(() => {
      localStorage.setItem('pf_customer_access_token', 'test-token');
      global.fetch.mockImplementation((url) => {
        if (url.includes('/admin/stats')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              totalUsers: 100,
              totalRoutes: 50,
              totalStores: 200,
              geocoding: { unchanged: 10, needingBackfill: 5 }
            })
          });
        }
        if (url.includes('/admin/pending-businesses')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ businesses: [] })
          });
        }
        if (url.includes('/admin/pending-stores')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ stores: [] })
          });
        }
        if (url.includes('/api/reports')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ reports: [] })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });
    });

    it('should show welcome message with username', async () => {
      renderAdminDashboard({ isLogin: true, user: mockAdminUser });

      await waitFor(() => {
        expect(screen.getByText(/welcome, admin/i)).toBeInTheDocument();
      });
    });

    it('should show System Statistics header', async () => {
      renderAdminDashboard({ isLogin: true, user: mockAdminUser });

      await waitFor(() => {
        expect(screen.getByText('System Statistics')).toBeInTheDocument();
      });
    });

    it('should display total users count', async () => {
      renderAdminDashboard({ isLogin: true, user: mockAdminUser });

      await waitFor(() => {
        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.getByText('Total Users')).toBeInTheDocument();
      });
    });

    it('should display total routes count', async () => {
      renderAdminDashboard({ isLogin: true, user: mockAdminUser });

      await waitFor(() => {
        expect(screen.getByText('50')).toBeInTheDocument();
        expect(screen.getByText('Total Routes')).toBeInTheDocument();
      });
    });

    it('should display total stores count', async () => {
      renderAdminDashboard({ isLogin: true, user: mockAdminUser });

      await waitFor(() => {
        expect(screen.getByText('200')).toBeInTheDocument();
        expect(screen.getByText('Total Stores')).toBeInTheDocument();
      });
    });
  });

  describe('pending businesses', () => {
    const mockPendingBusinesses = [
      { id: 1, username: 'newbiz1', createdAt: '2024-01-15T10:00:00Z' },
      { id: 2, username: 'newbiz2', createdAt: '2024-01-16T10:00:00Z' }
    ];

    beforeEach(() => {
      localStorage.setItem('pf_customer_access_token', 'test-token');
      global.fetch.mockImplementation((url) => {
        if (url.includes('/admin/stats')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              totalUsers: 100,
              totalRoutes: 50,
              totalStores: 200,
              geocoding: { unchanged: 10, needingBackfill: 5 }
            })
          });
        }
        if (url.includes('/admin/pending-businesses')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ businesses: mockPendingBusinesses })
          });
        }
        if (url.includes('/admin/pending-stores')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ stores: [] })
          });
        }
        if (url.includes('/api/reports')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ reports: [] })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });
    });

    it('should show Pending Business Applications header', async () => {
      renderAdminDashboard({ isLogin: true, user: mockAdminUser });

      await waitFor(() => {
        expect(screen.getByText('Pending Business Applications')).toBeInTheDocument();
      });
    });

    it('should display pending business names', async () => {
      renderAdminDashboard({ isLogin: true, user: mockAdminUser });

      await waitFor(() => {
        expect(screen.getByText('newbiz1')).toBeInTheDocument();
        expect(screen.getByText('newbiz2')).toBeInTheDocument();
      });
    });

    it('should show Approve and Deny buttons for each business', async () => {
      renderAdminDashboard({ isLogin: true, user: mockAdminUser });

      await waitFor(() => {
        const approveButtons = screen.getAllByRole('button', { name: /approve/i });
        const denyButtons = screen.getAllByRole('button', { name: /deny/i });
        expect(approveButtons).toHaveLength(2);
        expect(denyButtons).toHaveLength(2);
      });
    });
  });

  describe('empty pending businesses', () => {
    beforeEach(() => {
      localStorage.setItem('pf_customer_access_token', 'test-token');
      global.fetch.mockImplementation((url) => {
        if (url.includes('/admin/stats')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              totalUsers: 100,
              totalRoutes: 50,
              totalStores: 200,
              geocoding: { unchanged: 0, needingBackfill: 0 }
            })
          });
        }
        if (url.includes('/admin/pending-businesses')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ businesses: [] })
          });
        }
        if (url.includes('/admin/pending-stores')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ stores: [] })
          });
        }
        if (url.includes('/api/reports')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ reports: [] })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });
    });

    it('should show no pending applications message', async () => {
      renderAdminDashboard({ isLogin: true, user: mockAdminUser });

      await waitFor(() => {
        expect(screen.getByText(/no pending business applications/i)).toBeInTheDocument();
      });
    });
  });

  describe('user reports', () => {
    beforeEach(() => {
      localStorage.setItem('pf_customer_access_token', 'test-token');
      global.fetch.mockImplementation((url) => {
        if (url.includes('/admin/stats')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              totalUsers: 100,
              totalRoutes: 50,
              totalStores: 200,
              geocoding: { unchanged: 0, needingBackfill: 0 }
            })
          });
        }
        if (url.includes('/admin/pending-businesses')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ businesses: [] })
          });
        }
        if (url.includes('/admin/pending-stores')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ stores: [] })
          });
        }
        if (url.includes('/api/reports')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ reports: [] })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });
    });

    it('should show User Reports header', async () => {
      renderAdminDashboard({ isLogin: true, user: mockAdminUser });

      await waitFor(() => {
        expect(screen.getByText('User Reports')).toBeInTheDocument();
      });
    });

    it('should show report status filter dropdown', async () => {
      renderAdminDashboard({ isLogin: true, user: mockAdminUser });

      await waitFor(() => {
        const select = screen.getByRole('combobox');
        expect(select).toBeInTheDocument();
      });
    });

    it('should show no reports message when empty', async () => {
      renderAdminDashboard({ isLogin: true, user: mockAdminUser });

      await waitFor(() => {
        expect(screen.getByText(/no.*reports found/i)).toBeInTheDocument();
      });
    });
  });

  describe('loading states', () => {
    it('should show loading message for stats', () => {
      global.fetch.mockImplementation(() => new Promise(() => {}));

      renderAdminDashboard({ isLogin: true, user: mockAdminUser });

      expect(screen.getByText(/loading statistics/i)).toBeInTheDocument();
    });

    it('should show loading message for applications', () => {
      global.fetch.mockImplementation(() => new Promise(() => {}));

      renderAdminDashboard({ isLogin: true, user: mockAdminUser });

      expect(screen.getByText(/loading applications/i)).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should show error message on stats fetch failure', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/admin/stats')) {
          return Promise.resolve({
            ok: false,
            status: 403,
            json: () => Promise.resolve({ message: 'Access denied' })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      renderAdminDashboard({ isLogin: true, user: mockAdminUser });

      await waitFor(() => {
        expect(screen.getByText(/access denied/i)).toBeInTheDocument();
      });
    });
  });
});
