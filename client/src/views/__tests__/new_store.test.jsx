/**
 * NewStore View Tests
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import NewStore from '../new_store';
import { setupGeolocationMock, createPosition } from '../../test-utils/mock-geolocation';

// Mock react-router-dom
jest.mock('react-router-dom');

describe('NewStore', () => {
  let originalFetch;
  let geoMock;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = jest.fn();
    geoMock = setupGeolocationMock();
    jest.useFakeTimers();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  const renderNewStore = (props = {}) => {
    const defaultProps = {
      onLoginSuccess: jest.fn()
    };
    return render(<NewStore {...defaultProps} {...props} />);
  };

  describe('form rendering', () => {
    it('should render Create New Store title', () => {
      renderNewStore();

      expect(screen.getByText('Create New Store')).toBeInTheDocument();
    });

    it('should render store name input', () => {
      renderNewStore();

      expect(screen.getByLabelText(/store name/i)).toBeInTheDocument();
    });

    it('should render address input', () => {
      renderNewStore();

      expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
    });

    it('should render Create Store button', () => {
      renderNewStore();

      expect(screen.getByRole('button', { name: /create store/i })).toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    it('should require store name', () => {
      renderNewStore();

      const nameInput = screen.getByLabelText(/store name/i);
      expect(nameInput).toBeRequired();
    });

    it('should require address', () => {
      renderNewStore();

      const addressInput = screen.getByLabelText(/address/i);
      expect(addressInput).toBeRequired();
    });
  });

  describe('form input', () => {
    it('should update store name on input', () => {
      renderNewStore();

      const nameInput = screen.getByLabelText(/store name/i);
      fireEvent.change(nameInput, { target: { value: 'Test Store' } });

      expect(nameInput).toHaveValue('Test Store');
    });

    it('should update address on input', () => {
      renderNewStore();

      const addressInput = screen.getByLabelText(/address/i);
      fireEvent.change(addressInput, { target: { value: '123 Main St' } });

      expect(addressInput).toHaveValue('123 Main St');
    });
  });

  describe('form submission', () => {
    it('should call API with correct data on submit', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Store created' })
      });

      renderNewStore();

      fireEvent.change(screen.getByLabelText(/store name/i), { target: { value: 'Test Store' } });
      fireEvent.change(screen.getByLabelText(/address/i), { target: { value: '123 Main St' } });

      fireEvent.click(screen.getByRole('button', { name: /create store/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/stores',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('Test Store')
          })
        );
      });
    });

    it('should show success message on successful creation', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Store created' })
      });

      renderNewStore();

      fireEvent.change(screen.getByLabelText(/store name/i), { target: { value: 'Test Store' } });
      fireEvent.change(screen.getByLabelText(/address/i), { target: { value: '123 Main St' } });

      fireEvent.click(screen.getByRole('button', { name: /create store/i }));

      await waitFor(() => {
        expect(screen.getByText('Store created')).toBeInTheDocument();
      });
    });

    it('should clear form on successful creation', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Store created' })
      });

      renderNewStore();

      fireEvent.change(screen.getByLabelText(/store name/i), { target: { value: 'Test Store' } });
      fireEvent.change(screen.getByLabelText(/address/i), { target: { value: '123 Main St' } });

      fireEvent.click(screen.getByRole('button', { name: /create store/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/store name/i)).toHaveValue('');
        expect(screen.getByLabelText(/address/i)).toHaveValue('');
      });
    });

    it('should show error message on API failure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Store already exists' })
      });

      renderNewStore();

      fireEvent.change(screen.getByLabelText(/store name/i), { target: { value: 'Test Store' } });
      fireEvent.change(screen.getByLabelText(/address/i), { target: { value: '123 Main St' } });

      fireEvent.click(screen.getByRole('button', { name: /create store/i }));

      await waitFor(() => {
        expect(screen.getByText('Store already exists')).toBeInTheDocument();
      });
    });
  });

  describe('geolocation handling', () => {
    it('should show location error when geolocation fails', async () => {
      geoMock = setupGeolocationMock({ shouldError: true });

      renderNewStore();

      fireEvent.change(screen.getByLabelText(/store name/i), { target: { value: 'Test Store' } });
      fireEvent.change(screen.getByLabelText(/address/i), { target: { value: '123 Main St' } });

      fireEvent.click(screen.getByRole('button', { name: /create store/i }));

      await waitFor(() => {
        expect(screen.getByText(/could not determine your location/i)).toBeInTheDocument();
      });
    });
  });

  describe('message timeout', () => {
    it('should clear message after timeout', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Store created' })
      });

      renderNewStore();

      fireEvent.change(screen.getByLabelText(/store name/i), { target: { value: 'Test Store' } });
      fireEvent.change(screen.getByLabelText(/address/i), { target: { value: '123 Main St' } });

      fireEvent.click(screen.getByRole('button', { name: /create store/i }));

      await waitFor(() => {
        expect(screen.getByText('Store created')).toBeInTheDocument();
      });

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(screen.queryByText('Store created')).not.toBeInTheDocument();
      });
    });
  });
});
