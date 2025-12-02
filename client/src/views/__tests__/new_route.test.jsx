/**
 * NewRoute View Tests
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import NewRoute from '../new_route';
import { setupGeolocationMock } from '../../test-utils/mock-geolocation';

describe('NewRoute', () => {
  let originalFetch;

  beforeEach(() => {
    jest.useFakeTimers();
    originalFetch = global.fetch;
    global.fetch = jest.fn();
    setupGeolocationMock();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  const mockUser = { id: 1, username: 'testuser' };

  const mockStores = [
    { id: 1, name: 'Store A', address: '123 Main St', latitude: '40.7128', longitude: '-74.0060' },
    { id: 2, name: 'Store B', address: '456 Oak Ave', latitude: '40.7200', longitude: '-74.0100' },
    { id: 3, name: 'Store C', address: '789 Pine Rd', latitude: '40.7300', longitude: '-74.0200' },
    { id: 4, name: 'Store D', address: '101 Elm St', latitude: '40.7400', longitude: '-74.0300' }
  ];

  const renderNewRoute = (props = {}) => {
    const defaultProps = {
      isLogin: true,
      user: mockUser
    };
    return render(<NewRoute {...defaultProps} {...props} />);
  };

  // Helper to advance timers and flush promises
  const flushPromises = async () => {
    await act(async () => {
      jest.runAllTimers();
      await Promise.resolve();
    });
  };

  describe('initial render', () => {
    beforeEach(() => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ stores: mockStores })
      });
    });

    it('should render route name input', async () => {
      renderNewRoute();
      await flushPromises();

      expect(screen.getByPlaceholderText(/route name/i)).toBeInTheDocument();
    });

    it('should render submit button', async () => {
      renderNewRoute();
      await flushPromises();

      expect(screen.getByRole('button', { type: 'submit' })).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should show loading message while fetching stores', () => {
      global.fetch.mockImplementation(() => new Promise(() => {}));

      renderNewRoute();

      expect(screen.getByText(/loading nearby stores/i)).toBeInTheDocument();
    });
  });

  describe('stores list', () => {
    beforeEach(() => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ stores: mockStores })
      });
    });

    it('should render store names', async () => {
      renderNewRoute();
      await flushPromises();

      expect(screen.getByText('Store A')).toBeInTheDocument();
      expect(screen.getByText('Store B')).toBeInTheDocument();
      expect(screen.getByText('Store C')).toBeInTheDocument();
    });

    it('should render store checkboxes', async () => {
      renderNewRoute();
      await flushPromises();

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(4);
    });

    it('should toggle store selection on checkbox click', async () => {
      renderNewRoute();
      await flushPromises();

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      expect(checkboxes[0]).toBeChecked();
    });
  });

  describe('empty stores', () => {
    it('should show no stores message when empty', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ stores: [] })
      });

      renderNewRoute();
      await flushPromises();

      expect(screen.getByText(/no stores found/i)).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should show error on fetch failure', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: 'Error' })
      });

      renderNewRoute();
      await flushPromises();

      expect(screen.getByText(/could not load nearby stores/i)).toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    beforeEach(() => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ stores: mockStores })
      });
    });

    it('should show error when route name is empty', async () => {
      renderNewRoute();
      await flushPromises();

      // Select stores
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      fireEvent.click(checkboxes[1]);
      fireEvent.click(checkboxes[2]);

      // Submit without name
      fireEvent.click(screen.getByRole('button', { type: 'submit' }));

      expect(screen.getByText(/please provide a route name/i)).toBeInTheDocument();
    });

    it('should show error when less than 3 stores selected', async () => {
      renderNewRoute();
      await flushPromises();

      // Set route name
      fireEvent.change(screen.getByPlaceholderText(/route name/i), { target: { value: 'Test Route' } });

      // Select only 2 stores
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      fireEvent.click(checkboxes[1]);

      fireEvent.click(screen.getByRole('button', { type: 'submit' }));

      expect(screen.getByText(/please select at least 3 stores/i)).toBeInTheDocument();
    });
  });

  describe('store selection limit', () => {
    beforeEach(() => {
      const manyStores = Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        name: `Store ${i + 1}`,
        address: `${i + 1} Main St`,
        latitude: '40.7128',
        longitude: '-74.0060'
      }));

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ stores: manyStores })
      });
    });

    it('should show error when trying to select more than 10 stores', async () => {
      renderNewRoute();
      await flushPromises();

      // Select 11 stores
      const checkboxes = screen.getAllByRole('checkbox');
      for (let i = 0; i < 11; i++) {
        fireEvent.click(checkboxes[i]);
      }

      expect(screen.getByText(/you may select up to 10 stores/i)).toBeInTheDocument();
    });
  });

  describe('successful submission', () => {
    it('should call API with correct data on submit', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ stores: mockStores })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ message: 'Route created', route: { id: 1 } })
        });

      renderNewRoute();
      await flushPromises();

      // Set route name
      fireEvent.change(screen.getByPlaceholderText(/route name/i), { target: { value: 'My Test Route' } });

      // Select 3 stores
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      fireEvent.click(checkboxes[1]);
      fireEvent.click(checkboxes[2]);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { type: 'submit' }));
        jest.runAllTimers();
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/routes',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('My Test Route')
        })
      );
    });

    it('should show success message on successful creation', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ stores: mockStores })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ message: 'Route created', route: { id: 1 } })
        });

      renderNewRoute();
      await flushPromises();

      fireEvent.change(screen.getByPlaceholderText(/route name/i), { target: { value: 'My Test Route' } });

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      fireEvent.click(checkboxes[1]);
      fireEvent.click(checkboxes[2]);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { type: 'submit' }));
        await Promise.resolve();
      });
      await flushPromises();

      expect(screen.getByText('Route created')).toBeInTheDocument();
    });

    it('should clear form on successful creation', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ stores: mockStores })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ message: 'Route created', route: { id: 1 } })
        });

      renderNewRoute();
      await flushPromises();

      fireEvent.change(screen.getByPlaceholderText(/route name/i), { target: { value: 'My Test Route' } });

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      fireEvent.click(checkboxes[1]);
      fireEvent.click(checkboxes[2]);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { type: 'submit' }));
        await Promise.resolve();
      });
      await flushPromises();

      expect(screen.getByPlaceholderText(/route name/i)).toHaveValue('');
    });
  });
});
