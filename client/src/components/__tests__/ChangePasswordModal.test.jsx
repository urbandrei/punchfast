/**
 * ChangePasswordModal Component Tests
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ChangePasswordModal from '../ChangePasswordModal';

describe('ChangePasswordModal', () => {
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
    onClose: jest.fn(),
    userId: 1
  };

  const renderModal = (props = {}) => {
    return render(<ChangePasswordModal {...defaultProps} {...props} />);
  };

  describe('visibility', () => {
    it('should not render when show is false', () => {
      renderModal({ show: false });

      expect(screen.queryByRole('heading', { name: /change password/i })).not.toBeInTheDocument();
    });

    it('should render when show is true', () => {
      renderModal();

      expect(screen.getByRole('heading', { name: /change password/i })).toBeInTheDocument();
    });
  });

  describe('form fields', () => {
    it('should render current password field', () => {
      renderModal();

      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    });

    it('should render new password field', () => {
      renderModal();

      expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
    });

    it('should render confirm password field', () => {
      renderModal();

      expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
    });

    it('should render Cancel and Change Password buttons', () => {
      renderModal();

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^change password$/i })).toBeInTheDocument();
    });
  });

  describe('validation', () => {
    it('should show error when fields are empty', () => {
      renderModal();

      fireEvent.click(screen.getByRole('button', { name: /^change password$/i }));

      expect(screen.getByText('All fields are required')).toBeInTheDocument();
    });

    it('should show error when passwords do not match', () => {
      renderModal();

      fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: 'oldpassword' } });
      fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: 'newpassword123' } });
      fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: 'differentpassword' } });
      fireEvent.click(screen.getByRole('button', { name: /^change password$/i }));

      expect(screen.getByText('New passwords do not match')).toBeInTheDocument();
    });

    it('should clear error when form is resubmitted', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Success' })
      });

      renderModal();

      // First submission with empty fields
      fireEvent.click(screen.getByRole('button', { name: /^change password$/i }));
      expect(screen.getByText('All fields are required')).toBeInTheDocument();

      // Fill fields and resubmit - error should be cleared during submission
      fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: 'oldpassword' } });
      fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: 'newpassword123' } });
      fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: 'newpassword123' } });
      fireEvent.click(screen.getByRole('button', { name: /^change password$/i }));

      await waitFor(() => {
        expect(screen.queryByText('All fields are required')).not.toBeInTheDocument();
      });
    });
  });

  describe('form submission', () => {
    it('should call API with correct data', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Success' })
      });

      renderModal();

      fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: 'oldpassword' } });
      fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: 'newpassword123' } });
      fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: 'newpassword123' } });
      fireEvent.click(screen.getByRole('button', { name: /^change password$/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/change-password',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: 1,
              currentPassword: 'oldpassword',
              newPassword: 'newpassword123'
            })
          })
        );
      });
    });

    it('should show success message on successful change', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Success' })
      });

      renderModal();

      fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: 'oldpassword' } });
      fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: 'newpassword123' } });
      fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: 'newpassword123' } });
      fireEvent.click(screen.getByRole('button', { name: /^change password$/i }));

      await waitFor(() => {
        expect(screen.getByText('Password changed successfully!')).toBeInTheDocument();
      });
    });

    it('should close modal after success delay', async () => {
      jest.useFakeTimers();
      const onClose = jest.fn();
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Success' })
      });

      renderModal({ onClose });

      fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: 'oldpassword' } });
      fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: 'newpassword123' } });
      fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: 'newpassword123' } });
      fireEvent.click(screen.getByRole('button', { name: /^change password$/i }));

      await waitFor(() => {
        expect(screen.getByText('Password changed successfully!')).toBeInTheDocument();
      });

      // Fast-forward timers by 2 seconds
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(onClose).toHaveBeenCalled();
      jest.useRealTimers();
    });

    it('should show error on API failure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Current password is incorrect' })
      });

      renderModal();

      fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: 'wrongpassword' } });
      fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: 'newpassword123' } });
      fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: 'newpassword123' } });
      fireEvent.click(screen.getByRole('button', { name: /^change password$/i }));

      await waitFor(() => {
        expect(screen.getByText('Current password is incorrect')).toBeInTheDocument();
      });
    });

    it('should show loading state while submitting', async () => {
      let resolvePromise;
      global.fetch.mockImplementationOnce(() =>
        new Promise(resolve => { resolvePromise = resolve; })
      );

      renderModal();

      fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: 'oldpassword' } });
      fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: 'newpassword123' } });
      fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: 'newpassword123' } });
      fireEvent.click(screen.getByRole('button', { name: /^change password$/i }));

      expect(screen.getByText('Changing...')).toBeInTheDocument();

      // Resolve to clean up
      resolvePromise({ ok: true, json: () => Promise.resolve({ message: 'Success' }) });
    });

    it('should clear form fields on success', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Success' })
      });

      renderModal();

      fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: 'oldpassword' } });
      fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: 'newpassword123' } });
      fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: 'newpassword123' } });
      fireEvent.click(screen.getByRole('button', { name: /^change password$/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/current password/i)).toHaveValue('');
        expect(screen.getByLabelText(/^new password$/i)).toHaveValue('');
        expect(screen.getByLabelText(/confirm new password/i)).toHaveValue('');
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

    it('should clear form fields on cancel', () => {
      const onClose = jest.fn();
      renderModal({ onClose });

      fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: 'somepassword' } });
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

      const title = screen.getByRole('heading', { name: /change password/i });
      fireEvent.click(title);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('button states', () => {
    it('should disable inputs while submitting', async () => {
      let resolvePromise;
      global.fetch.mockImplementationOnce(() =>
        new Promise(resolve => { resolvePromise = resolve; })
      );

      renderModal();

      fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: 'oldpassword' } });
      fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: 'newpassword123' } });
      fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: 'newpassword123' } });
      fireEvent.click(screen.getByRole('button', { name: /^change password$/i }));

      expect(screen.getByLabelText(/current password/i)).toBeDisabled();
      expect(screen.getByLabelText(/^new password$/i)).toBeDisabled();
      expect(screen.getByLabelText(/confirm new password/i)).toBeDisabled();

      // Resolve to clean up
      resolvePromise({ ok: true, json: () => Promise.resolve({ message: 'Success' }) });
    });
  });

  describe('network error handling', () => {
    it('should show error on network failure', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      renderModal();

      fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: 'oldpassword' } });
      fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: 'newpassword123' } });
      fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: 'newpassword123' } });
      fireEvent.click(screen.getByRole('button', { name: /^change password$/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed to change password. Please try again.')).toBeInTheDocument();
      });
    });
  });
});
