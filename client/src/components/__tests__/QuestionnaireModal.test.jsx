/**
 * QuestionnaireModal Component Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuestionnaireModal from '../QuestionnaireModal';

describe('QuestionnaireModal', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const defaultQuestion = {
    fieldName: 'hasWifi',
    questionText: 'Does this store have WiFi?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
      { value: 'unsure', label: 'Not sure' }
    ]
  };

  const defaultProps = {
    show: true,
    userId: 1,
    storeId: 1,
    storeName: 'Test Store',
    question: defaultQuestion,
    onSubmit: jest.fn(),
    onSkip: jest.fn(),
    onClose: jest.fn()
  };

  const renderModal = (props = {}) => {
    return render(<QuestionnaireModal {...defaultProps} {...props} />);
  };

  describe('visibility', () => {
    it('should not render when show is false', () => {
      renderModal({ show: false });

      expect(screen.queryByText('Quick Question')).not.toBeInTheDocument();
    });

    it('should not render when question is null', () => {
      renderModal({ question: null });

      expect(screen.queryByText('Quick Question')).not.toBeInTheDocument();
    });

    it('should render when show is true and question is provided', () => {
      renderModal();

      expect(screen.getByText('Quick Question')).toBeInTheDocument();
    });
  });

  describe('content display', () => {
    it('should show question mark icon', () => {
      renderModal();

      expect(screen.getByText('?')).toBeInTheDocument();
    });

    it('should show "Quick Question" title', () => {
      renderModal();

      expect(screen.getByText('Quick Question')).toBeInTheDocument();
    });

    it('should show store name', () => {
      renderModal();

      expect(screen.getByText(/About Test Store/)).toBeInTheDocument();
    });

    it('should show question text', () => {
      renderModal();

      expect(screen.getByText('Does this store have WiFi?')).toBeInTheDocument();
    });

    it('should show all answer options', () => {
      renderModal();

      expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Not sure' })).toBeInTheDocument();
    });

    it('should show Skip and Submit buttons', () => {
      renderModal();

      expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });
  });

  describe('option selection', () => {
    it('should highlight selected option', async () => {
      renderModal();

      const yesButton = screen.getByRole('button', { name: 'Yes' });
      await userEvent.click(yesButton);

      expect(yesButton).toHaveStyle({ backgroundColor: 'rgb(48, 44, 154)' });
    });

    it('should deselect previous option when selecting new one', async () => {
      renderModal();

      const yesButton = screen.getByRole('button', { name: 'Yes' });
      const noButton = screen.getByRole('button', { name: 'No' });

      await userEvent.click(yesButton);
      await userEvent.click(noButton);

      expect(noButton).toHaveStyle({ backgroundColor: 'rgb(48, 44, 154)' });
      expect(yesButton).toHaveStyle({ backgroundColor: 'white' });
    });
  });

  describe('submit action', () => {
    it('should show error when trying to submit without selection', async () => {
      renderModal();

      await userEvent.click(screen.getByRole('button', { name: /submit/i }));

      expect(screen.getByText('Please select an option')).toBeInTheDocument();
    });

    it('should call API with answer on submit', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ unlockedAchievements: [] })
      });

      renderModal();

      await userEvent.click(screen.getByRole('button', { name: 'Yes' }));
      await userEvent.click(screen.getByRole('button', { name: /submit/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/questionnaire/answer',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: 1,
              storeId: 1,
              fieldName: 'hasWifi',
              suggestedValue: 'yes',
              skipped: false
            })
          })
        );
      });
    });

    it('should call onSubmit with unlocked achievements', async () => {
      const onSubmit = jest.fn();
      const unlockedAchievements = [{ name: 'Helpful Helper' }];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ unlockedAchievements })
      });

      renderModal({ onSubmit });

      await userEvent.click(screen.getByRole('button', { name: 'Yes' }));
      await userEvent.click(screen.getByRole('button', { name: /submit/i }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(unlockedAchievements);
      });
    });

    it('should call onClose on successful submit', async () => {
      const onClose = jest.fn();

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ unlockedAchievements: [] })
      });

      renderModal({ onClose });

      await userEvent.click(screen.getByRole('button', { name: 'Yes' }));
      await userEvent.click(screen.getByRole('button', { name: /submit/i }));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('should show loading state while submitting', async () => {
      global.fetch.mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ unlockedAchievements: [] })
        }), 100))
      );

      renderModal();

      await userEvent.click(screen.getByRole('button', { name: 'Yes' }));
      await userEvent.click(screen.getByRole('button', { name: /submit/i }));

      expect(screen.getByText('Submitting...')).toBeInTheDocument();
    });

    it('should show error on API failure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Server error' })
      });

      renderModal();

      await userEvent.click(screen.getByRole('button', { name: 'Yes' }));
      await userEvent.click(screen.getByRole('button', { name: /submit/i }));

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
    });
  });

  describe('skip action', () => {
    it('should call API with skipped flag', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      });

      renderModal();

      await userEvent.click(screen.getByRole('button', { name: /skip/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/questionnaire/answer',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              userId: 1,
              storeId: 1,
              fieldName: 'hasWifi',
              suggestedValue: null,
              skipped: true
            })
          })
        );
      });
    });

    it('should call onSkip callback on success', async () => {
      const onSkip = jest.fn();

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      });

      renderModal({ onSkip });

      await userEvent.click(screen.getByRole('button', { name: /skip/i }));

      await waitFor(() => {
        expect(onSkip).toHaveBeenCalled();
      });
    });

    it('should call onClose on successful skip', async () => {
      const onClose = jest.fn();

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      });

      renderModal({ onClose });

      await userEvent.click(screen.getByRole('button', { name: /skip/i }));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('should show error on skip API failure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Skip failed' })
      });

      renderModal();

      await userEvent.click(screen.getByRole('button', { name: /skip/i }));

      await waitFor(() => {
        expect(screen.getByText('Skip failed')).toBeInTheDocument();
      });
    });
  });

  describe('button states', () => {
    it('should disable option buttons while submitting', async () => {
      global.fetch.mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ unlockedAchievements: [] })
        }), 100))
      );

      renderModal();

      await userEvent.click(screen.getByRole('button', { name: 'Yes' }));
      await userEvent.click(screen.getByRole('button', { name: /submit/i }));

      const noButton = screen.getByRole('button', { name: 'No' });
      expect(noButton).toBeDisabled();
    });

    it('should disable Skip button while submitting', async () => {
      global.fetch.mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ unlockedAchievements: [] })
        }), 100))
      );

      renderModal();

      await userEvent.click(screen.getByRole('button', { name: 'Yes' }));
      await userEvent.click(screen.getByRole('button', { name: /submit/i }));

      const skipButton = screen.getByRole('button', { name: /skip/i });
      expect(skipButton).toBeDisabled();
    });
  });

  describe('different question types', () => {
    it('should display price range question', () => {
      const priceQuestion = {
        fieldName: 'priceRange',
        questionText: 'What is the price range?',
        options: [
          { value: '$', label: 'Budget ($)' },
          { value: '$$', label: 'Moderate ($$)' },
          { value: '$$$', label: 'Expensive ($$$)' }
        ]
      };

      renderModal({ question: priceQuestion });

      expect(screen.getByText('What is the price range?')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Budget ($)' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Moderate ($$)' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Expensive ($$$)' })).toBeInTheDocument();
    });
  });
});
