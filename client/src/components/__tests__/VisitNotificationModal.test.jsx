/**
 * VisitNotificationModal Component Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VisitNotificationModal from '../VisitNotificationModal';

describe('VisitNotificationModal', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const defaultProps = {
    show: true,
    stores: [{ id: 1, name: 'Test Store', address: '123 Main St' }],
    userId: 1,
    onVisit: jest.fn(),
    onNotVisiting: jest.fn(),
    onClose: jest.fn(),
    onQuestionnaireTriggered: jest.fn()
  };

  const renderModal = (props = {}) => {
    return render(<VisitNotificationModal {...defaultProps} {...props} />);
  };

  describe('visibility', () => {
    it('should not render when show is false', () => {
      renderModal({ show: false });

      expect(screen.queryByText('Store Nearby!')).not.toBeInTheDocument();
    });

    it('should not render when stores is empty', () => {
      renderModal({ stores: [] });

      expect(screen.queryByText('Store Nearby!')).not.toBeInTheDocument();
    });

    it('should not render when stores is null', () => {
      renderModal({ stores: null });

      expect(screen.queryByText('Store Nearby!')).not.toBeInTheDocument();
    });

    it('should render when show is true and stores has items', () => {
      renderModal();

      expect(screen.getByText('Store Nearby!')).toBeInTheDocument();
    });
  });

  describe('single store display', () => {
    it('should show store name', () => {
      renderModal();

      expect(screen.getByText('Test Store')).toBeInTheDocument();
    });

    it('should show store address', () => {
      renderModal();

      expect(screen.getByText('123 Main St')).toBeInTheDocument();
    });

    it('should show single store title', () => {
      renderModal();

      expect(screen.getByText('Store Nearby!')).toBeInTheDocument();
    });

    it('should show visit prompt', () => {
      renderModal();

      expect(screen.getByText('Would you like to record a visit?')).toBeInTheDocument();
    });
  });

  describe('multiple stores display', () => {
    const multipleStores = [
      { id: 1, name: 'Store One', address: '123 Main St' },
      { id: 2, name: 'Store Two', address: '456 Oak Ave' }
    ];

    it('should show multiple stores title', () => {
      renderModal({ stores: multipleStores });

      expect(screen.getByText('Multiple Stores Nearby!')).toBeInTheDocument();
    });

    it('should show checkboxes for each store', () => {
      renderModal({ stores: multipleStores });

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(2);
    });

    it('should show all store names', () => {
      renderModal({ stores: multipleStores });

      expect(screen.getByText('Store One')).toBeInTheDocument();
      expect(screen.getByText('Store Two')).toBeInTheDocument();
    });

    it('should allow selecting stores', async () => {
      renderModal({ stores: multipleStores });

      const checkboxes = screen.getAllByRole('checkbox');
      await userEvent.click(checkboxes[0]);

      expect(checkboxes[0]).toBeChecked();
    });

    it('should allow deselecting stores', async () => {
      renderModal({ stores: multipleStores });

      const checkboxes = screen.getAllByRole('checkbox');
      await userEvent.click(checkboxes[0]);
      await userEvent.click(checkboxes[0]);

      expect(checkboxes[0]).not.toBeChecked();
    });

    it('should show error when trying to visit with no selection', async () => {
      renderModal({ stores: multipleStores });

      await userEvent.click(screen.getByRole('button', { name: /^visit$/i }));

      expect(screen.getByText('Please select at least one store to visit')).toBeInTheDocument();
    });
  });

  describe('visit action', () => {
    it('should call API to record visit', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ visit: { id: 1 } })
      });

      renderModal();

      await userEvent.click(screen.getByRole('button', { name: /^visit$/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/visits',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          })
        );
      });
    });

    it('should call onVisit callback on success', async () => {
      const onVisit = jest.fn();
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ visit: { id: 1 } })
      });

      renderModal({ onVisit });

      await userEvent.click(screen.getByRole('button', { name: /^visit$/i }));

      await waitFor(() => {
        expect(onVisit).toHaveBeenCalledWith([1]);
      });
    });

    it('should call onClose on success', async () => {
      const onClose = jest.fn();
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ visit: { id: 1 } })
      });

      renderModal({ onClose });

      await userEvent.click(screen.getByRole('button', { name: /^visit$/i }));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('should show loading state while submitting', async () => {
      global.fetch.mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ visit: { id: 1 } })
        }), 100))
      );

      renderModal();

      await userEvent.click(screen.getByRole('button', { name: /^visit$/i }));

      expect(screen.getByText('Recording...')).toBeInTheDocument();
    });

    it('should show error on API failure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Server error' })
      });

      renderModal();

      await userEvent.click(screen.getByRole('button', { name: /^visit$/i }));

      await waitFor(() => {
        expect(screen.getByText('Some visits could not be recorded. Please try again.')).toBeInTheDocument();
      });
    });

    it('should trigger questionnaire when API returns shouldShowQuestionnaire', async () => {
      const onQuestionnaireTriggered = jest.fn();
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          visit: { id: 1, storeId: 1 },
          shouldShowQuestionnaire: true
        })
      });

      renderModal({ onQuestionnaireTriggered });

      await userEvent.click(screen.getByRole('button', { name: /^visit$/i }));

      await waitFor(() => {
        expect(onQuestionnaireTriggered).toHaveBeenCalled();
      });
    });
  });

  describe('not visiting action', () => {
    it('should call onNotVisiting callback', async () => {
      const onNotVisiting = jest.fn();

      renderModal({ onNotVisiting });

      await userEvent.click(screen.getByRole('button', { name: /not visiting/i }));

      expect(onNotVisiting).toHaveBeenCalledWith([1]);
    });

    it('should call onClose', async () => {
      const onClose = jest.fn();

      renderModal({ onClose });

      await userEvent.click(screen.getByRole('button', { name: /not visiting/i }));

      expect(onClose).toHaveBeenCalled();
    });

    it('should add denial to localStorage', async () => {
      renderModal();

      await userEvent.click(screen.getByRole('button', { name: /not visiting/i }));

      const denials = localStorage.getItem('pf_visit_denials');
      expect(denials).not.toBeNull();
    });
  });

  describe('backdrop interaction', () => {
    it('should call handleNotVisiting when clicking backdrop', () => {
      const onNotVisiting = jest.fn();
      const { container } = renderModal({ onNotVisiting });

      // Click on the backdrop (first div child)
      const backdrop = container.firstChild;
      fireEvent.click(backdrop);

      expect(onNotVisiting).toHaveBeenCalled();
    });

    it('should not close when clicking modal content', () => {
      const onNotVisiting = jest.fn();
      renderModal({ onNotVisiting });

      // Click on the store name (inside modal content)
      const storeName = screen.getByText('Test Store');
      fireEvent.click(storeName);

      expect(onNotVisiting).not.toHaveBeenCalled();
    });
  });

  describe('multiple store visit', () => {
    const multipleStores = [
      { id: 1, name: 'Store One', address: '123 Main St' },
      { id: 2, name: 'Store Two', address: '456 Oak Ave' },
      { id: 3, name: 'Store Three', address: '789 Elm St' }
    ];

    it('should record visits for all selected stores', async () => {
      global.fetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ visit: { id: 1 } }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ visit: { id: 2 } }) });

      const onVisit = jest.fn();
      renderModal({ stores: multipleStores, onVisit });

      const checkboxes = screen.getAllByRole('checkbox');
      await userEvent.click(checkboxes[0]);
      await userEvent.click(checkboxes[1]);

      await userEvent.click(screen.getByRole('button', { name: /^visit$/i }));

      await waitFor(() => {
        expect(onVisit).toHaveBeenCalledWith([1, 2]);
      });
    });
  });
});
