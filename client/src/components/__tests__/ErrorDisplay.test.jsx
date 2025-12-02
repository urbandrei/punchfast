/**
 * ErrorDisplay Component Tests
 */

import { render, screen } from '@testing-library/react';
import ErrorDisplay from '../ErrorDisplay';

describe('ErrorDisplay', () => {
  it('should render error message', () => {
    render(<ErrorDisplay message="Something went wrong" />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should render error icon', () => {
    render(<ErrorDisplay message="Error occurred" />);

    expect(screen.getByText('✕')).toBeInTheDocument();
  });

  it('should show API helper text by default', () => {
    render(<ErrorDisplay message="Network error" />);

    expect(screen.getByText('Please check your internet connection and try again.')).toBeInTheDocument();
  });

  it('should show API helper text when type is api', () => {
    render(<ErrorDisplay message="Network error" type="api" />);

    expect(screen.getByText('Please check your internet connection and try again.')).toBeInTheDocument();
  });

  it('should show location helper text when type is location', () => {
    render(<ErrorDisplay message="Location not available" type="location" />);

    expect(screen.getByText('Please enable location services or enter coordinates manually to search for stores.')).toBeInTheDocument();
  });

  it('should render with correct container class', () => {
    const { container } = render(<ErrorDisplay message="Error" />);

    expect(container.querySelector('.error-display-container')).toBeInTheDocument();
  });

  it('should render message in correct element', () => {
    const { container } = render(<ErrorDisplay message="Test error message" />);

    const messageEl = container.querySelector('.error-display-message');
    expect(messageEl).toHaveTextContent('Test error message');
  });

  it('should render helper text in correct element', () => {
    const { container } = render(<ErrorDisplay message="Error" type="location" />);

    const helperEl = container.querySelector('.error-display-helper');
    expect(helperEl).toHaveTextContent('Please enable location services');
  });
});
