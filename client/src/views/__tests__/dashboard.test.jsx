/**
 * Dashboard View Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from '../dashboard';
import { setupGeolocationMock } from '../../test-utils/mock-geolocation';

// Mock child components to simplify tests
jest.mock('../../components/routeCard', () => {
  return function MockRouteCard({ routeName, onLeaveClick }) {
    return (
      <div data-testid="route-card">
        <span>{routeName}</span>
        <button onClick={onLeaveClick}>Leave Route</button>
      </div>
    );
  };
});

jest.mock('../../components/storeCard', () => {
  return function MockStoreCard({ storeName }) {
    return <div data-testid="store-card">{storeName}</div>;
  };
});

describe('Dashboard', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = jest.fn();
    setupGeolocationMock();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const mockUser = { id: 1, username: 'testuser' };

  const renderDashboard = (props = {}) => {
    const defaultProps = {
      isLogin: false,
      user: null,
      onShowAuth: jest.fn()
    };
    return render(<Dashboard {...defaultProps} {...props} />);
  };

  describe('logged out state', () => {
    it('should show sign in prompt when not logged in', () => {
      renderDashboard({ isLogin: false, user: null });

      expect(screen.getByText('Welcome to Your Dashboard')).toBeInTheDocument();
      expect(screen.getByText(/please sign in/i)).toBeInTheDocument();
    });

    it('should show Sign In button when not logged in', () => {
      renderDashboard({ isLogin: false, user: null });

      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should call onShowAuth when Sign In clicked', () => {
      const onShowAuth = jest.fn();
      renderDashboard({ isLogin: false, user: null, onShowAuth });

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      expect(onShowAuth).toHaveBeenCalled();
    });
  });

  describe('logged in state', () => {
    beforeEach(() => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/route-starts/user/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ routeStarts: [] })
          });
        }
        if (url.includes('/saved-stores/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ stores: [] })
          });
        }
        if (url.includes('/visits/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ visits: [] })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });
    });

    it('should show My Routes header', async () => {
      renderDashboard({ isLogin: true, user: mockUser });

      await waitFor(() => {
        expect(screen.getByText('My Routes')).toBeInTheDocument();
      });
    });

    it('should show My Saved Stores header', async () => {
      renderDashboard({ isLogin: true, user: mockUser });

      await waitFor(() => {
        expect(screen.getByText('My Saved Stores')).toBeInTheDocument();
      });
    });

    it('should show Visit History header', async () => {
      renderDashboard({ isLogin: true, user: mockUser });

      await waitFor(() => {
        expect(screen.getByText('Visit History')).toBeInTheDocument();
      });
    });
  });

  describe('empty states', () => {
    beforeEach(() => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/route-starts/user/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ routeStarts: [] })
          });
        }
        if (url.includes('/saved-stores/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ stores: [] })
          });
        }
        if (url.includes('/visits/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ visits: [] })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });
    });

    it('should show empty routes message', async () => {
      renderDashboard({ isLogin: true, user: mockUser });

      await waitFor(() => {
        expect(screen.getByText(/haven't joined any routes/i)).toBeInTheDocument();
      });
    });

    it('should show empty stores message', async () => {
      renderDashboard({ isLogin: true, user: mockUser });

      await waitFor(() => {
        expect(screen.getByText(/haven't saved any stores/i)).toBeInTheDocument();
      });
    });

    it('should show empty visits message', async () => {
      renderDashboard({ isLogin: true, user: mockUser });

      await waitFor(() => {
        expect(screen.getByText(/no visits yet/i)).toBeInTheDocument();
      });
    });
  });

  describe('loading states', () => {
    it('should show loading message for routes', () => {
      global.fetch.mockImplementation(() => new Promise(() => {}));

      renderDashboard({ isLogin: true, user: mockUser });

      expect(screen.getByText(/loading your routes/i)).toBeInTheDocument();
    });

    it('should show loading message for stores', () => {
      global.fetch.mockImplementation(() => new Promise(() => {}));

      renderDashboard({ isLogin: true, user: mockUser });

      expect(screen.getByText(/loading your saved stores/i)).toBeInTheDocument();
    });

    it('should show loading message for visits', () => {
      global.fetch.mockImplementation(() => new Promise(() => {}));

      renderDashboard({ isLogin: true, user: mockUser });

      expect(screen.getByText(/loading your visit history/i)).toBeInTheDocument();
    });
  });

  describe('with data', () => {
    const mockRoutes = [
      {
        status: 'active',
        route: {
          id: 1,
          name: 'Test Route',
          routeType: 'usergenerated',
          stores: [{ id: 1, name: 'Store 1' }]
        }
      }
    ];

    const mockStores = [
      { id: 1, name: 'Saved Store', latitude: '40.7128', longitude: '-74.0060' }
    ];

    const mockVisits = [
      {
        id: 1,
        visitDate: '2024-01-15T10:30:00Z',
        visitStore: { name: 'Visited Store', address: '123 Main St' }
      }
    ];

    beforeEach(() => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/route-starts/user/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ routeStarts: mockRoutes })
          });
        }
        if (url.includes('/saved-stores/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ stores: mockStores })
          });
        }
        if (url.includes('/visits/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ visits: mockVisits })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });
    });

    it('should render route cards', async () => {
      renderDashboard({ isLogin: true, user: mockUser });

      await waitFor(() => {
        expect(screen.getByTestId('route-card')).toBeInTheDocument();
        expect(screen.getByText('Test Route')).toBeInTheDocument();
      });
    });

    it('should render store cards', async () => {
      renderDashboard({ isLogin: true, user: mockUser });

      await waitFor(() => {
        expect(screen.getByTestId('store-card')).toBeInTheDocument();
        expect(screen.getByText('Saved Store')).toBeInTheDocument();
      });
    });

    it('should render visit history', async () => {
      renderDashboard({ isLogin: true, user: mockUser });

      await waitFor(() => {
        expect(screen.getByText('Visited Store')).toBeInTheDocument();
        expect(screen.getByText('123 Main St')).toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    it('should show routes error on fetch failure', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/route-starts/user/')) {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ message: 'Error' })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      renderDashboard({ isLogin: true, user: mockUser });

      await waitFor(() => {
        expect(screen.getByText(/could not load joined routes/i)).toBeInTheDocument();
      });
    });

    it('should show stores error on fetch failure', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/saved-stores/')) {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ message: 'Error' })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      renderDashboard({ isLogin: true, user: mockUser });

      await waitFor(() => {
        expect(screen.getByText(/could not load saved stores/i)).toBeInTheDocument();
      });
    });

    it('should show visits error on fetch failure', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/visits/')) {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ message: 'Error' })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      renderDashboard({ isLogin: true, user: mockUser });

      await waitFor(() => {
        expect(screen.getByText(/could not load visit history/i)).toBeInTheDocument();
      });
    });
  });

  describe('leave route', () => {
    it('should call leave route API when Leave Route clicked', async () => {
      const mockRoutes = [
        {
          status: 'active',
          route: {
            id: 1,
            name: 'Test Route',
            routeType: 'usergenerated',
            stores: []
          }
        }
      ];

      global.fetch.mockImplementation((url, options) => {
        if (url.includes('/route-starts/user/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ routeStarts: mockRoutes })
          });
        }
        if (url.includes('/route-starts/leave') && options?.method === 'PUT') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ message: 'Left route' })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      renderDashboard({ isLogin: true, user: mockUser });

      await waitFor(() => {
        expect(screen.getByText('Test Route')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /leave route/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/route-starts/leave',
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({ userId: 1, routeId: 1 })
          })
        );
      });
    });
  });
});
