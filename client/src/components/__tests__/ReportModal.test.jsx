/**
 * ReportModal Component Tests
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReportModal from '../ReportModal';
import { customerTokens } from '../../utils/tokenManager';

// Mock tokenManager
jest.mock('../../utils/tokenManager', () => ({
  customerTokens: {
    getAccessToken: jest.fn()
  }
}));

describe('ReportModal', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = jest.fn();
    customerTokens.getAccessToken.mockReturnValue(null);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const defaultProps = {
    show: true,
    onClose: jest.fn(),
    itemType: 'store',
    itemId: 1,
    itemName: 'Test Store'
  };

  const renderModal = (props = {}) => {
    return render(<ReportModal {...defaultProps} {...props} />);
  };

  describe('visibility', () => {
    it('should not render when show is false', () => {
      renderModal({ show: false });

      expect(screen.queryByText(/report store/i)).not.toBeInTheDocument();
    });

    it('should render when show is true', () => {
      renderModal();

      expect(screen.getByText(/report store/i)).toBeInTheDocument();
    });
  });

  describe('content display', () => {
    it('should show "Report Store" for store type', () => {
      renderModal({ itemType: 'store' });

      expect(screen.getByText('Report Store')).toBeInTheDocument();
    });

    it('should show "Report Route" for route type', () => {
      renderModal({ itemType: 'route' });

      expect(screen.getByText('Report Route')).toBeInTheDocument();
    });

    it('should show item name', () => {
      renderModal();

      expect(screen.getByText('Test Store')).toBeInTheDocument();
    });

    it('should show category dropdown', () => {
      renderModal();

      expect(screen.getByText('Category *')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should show all category options', () => {
      renderModal();

      const select = screen.getByRole('combobox');

      expect(select).toContainHTML('Select a category...');
      expect(select).toContainHTML('Closed Permanently');
      expect(select).toContainHTML('Wrong Location');
      expect(select).toContainHTML('Duplicate Entry');
      expect(select).toContainHTML('Inappropriate Content');
      expect(select).toContainHTML('Spam');
      expect(select).toContainHTML('Other');
    });

    it('should show description textarea', () => {
      renderModal();

      expect(screen.getByText(/additional details/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/provide any additional information/i)).toBeInTheDocument();
    });

    it('should show Cancel and Submit buttons', () => {
      renderModal();

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit report/i })).toBeInTheDocument();
    });
  });

  describe('validation', () => {
    it('should show error when submitting without category', () => {
      renderModal();

      fireEvent.click(screen.getByRole('button', { name: /submit report/i }));

      expect(screen.getByText('Please select a category')).toBeInTheDocument();
    });
  });

  describe('form submission', () => {
    it('should call API with correct data (no auth)', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 })
      });

      renderModal();

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'closed_permanently' } });
      fireEvent.change(screen.getByPlaceholderText(/provide any additional information/i), { target: { value: 'Store is closed' } });
      fireEvent.click(screen.getByRole('button', { name: /submit report/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/reports',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reportedItemType: 'store',
              reportedItemId: 1,
              category: 'closed_permanently',
              description: 'Store is closed'
            })
          })
        );
      });
    });

    it('should include auth token when logged in', async () => {
      customerTokens.getAccessToken.mockReturnValue('test-token');
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 })
      });

      renderModal();

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'wrong_location' } });
      fireEvent.click(screen.getByRole('button', { name: /submit report/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/reports',
          expect.objectContaining({
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer test-token'
            }
          })
        );
      });
    });

    it('should show success message on successful submission', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 })
      });

      renderModal();

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'duplicate' } });
      fireEvent.click(screen.getByRole('button', { name: /submit report/i }));

      await waitFor(() => {
        expect(screen.getByText('Report Submitted')).toBeInTheDocument();
        expect(screen.getByText('Thank you for helping keep our data accurate!')).toBeInTheDocument();
      });
    });

    it('should close modal after success delay', async () => {
      jest.useFakeTimers();
      const onClose = jest.fn();
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 })
      });

      renderModal({ onClose });

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'spam' } });
      fireEvent.click(screen.getByRole('button', { name: /submit report/i }));

      await waitFor(() => {
        expect(screen.getByText('Report Submitted')).toBeInTheDocument();
      });

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(onClose).toHaveBeenCalled();
      jest.useRealTimers();
    });

    it('should show error on API failure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Already reported' })
      });

      renderModal();

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'other' } });
      fireEvent.click(screen.getByRole('button', { name: /submit report/i }));

      await waitFor(() => {
        expect(screen.getByText('Already reported')).toBeInTheDocument();
      });
    });

    it('should show loading state while submitting', async () => {
      let resolvePromise;
      global.fetch.mockImplementationOnce(() =>
        new Promise(resolve => { resolvePromise = resolve; })
      );

      renderModal();

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'wrong_location' } });
      fireEvent.click(screen.getByRole('button', { name: /submit report/i }));

      expect(screen.getByText('Submitting...')).toBeInTheDocument();

      // Resolve the promise to clean up
      resolvePromise({ ok: true, json: () => Promise.resolve({ id: 1 }) });
    });

    it('should send null description when empty', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 })
      });

      renderModal();

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'duplicate' } });
      fireEvent.click(screen.getByRole('button', { name: /submit report/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/reports',
          expect.objectContaining({
            body: JSON.stringify({
              reportedItemType: 'store',
              reportedItemId: 1,
              category: 'duplicate',
              description: null
            })
          })
        );
      });
    });
  });

  describe('cancel action', () => {
    it('should call onClose when Cancel clicked', () => {
      const onClose = jest.fn();
      renderModal({ onClose });

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('backdrop interaction', () => {
    it('should close when clicking backdrop', () => {
      const onClose = jest.fn();
      const { container } = renderModal({ onClose });

      const backdrop = container.firstChild;
      fireEvent.click(backdrop);

      expect(onClose).toHaveBeenCalled();
    });

    it('should not close when clicking modal content', () => {
      const onClose = jest.fn();
      renderModal({ onClose });

      const title = screen.getByText('Report Store');
      fireEvent.click(title);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('network error handling', () => {
    it('should show error on network failure', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      renderModal();

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'other' } });
      fireEvent.click(screen.getByRole('button', { name: /submit report/i }));

      await waitFor(() => {
        expect(screen.getByText('Network error. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('button states', () => {
    it('should disable buttons while submitting', async () => {
      let resolvePromise;
      global.fetch.mockImplementationOnce(() =>
        new Promise(resolve => { resolvePromise = resolve; })
      );

      renderModal();

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'other' } });
      fireEvent.click(screen.getByRole('button', { name: /submit report/i }));

      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();

      // Resolve the promise to clean up
      resolvePromise({ ok: true, json: () => Promise.resolve({ id: 1 }) });
    });
  });

  describe('route reports', () => {
    it('should handle route item type correctly', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 })
      });

      renderModal({ itemType: 'route', itemId: 5, itemName: 'Downtown Route' });

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'inappropriate_content' } });
      fireEvent.click(screen.getByRole('button', { name: /submit report/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/reports',
          expect.objectContaining({
            body: JSON.stringify({
              reportedItemType: 'route',
              reportedItemId: 5,
              category: 'inappropriate_content',
              description: null
            })
          })
        );
      });
    });
  });
});
