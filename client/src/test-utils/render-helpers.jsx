/**
 * Render Helpers - Custom render functions for testing components with providers
 */

import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';

/**
 * Render a component with BrowserRouter
 * @param {React.ReactElement} ui - Component to render
 * @param {Object} options - Render options
 * @param {string} options.route - Initial route path
 * @returns {Object} Render result with router utilities
 */
export const renderWithRouter = (ui, { route = '/', ...options } = {}) => {
  window.history.pushState({}, 'Test page', route);

  return {
    ...render(ui, {
      wrapper: BrowserRouter,
      ...options
    })
  };
};

/**
 * Render a component with MemoryRouter (better for testing)
 * @param {React.ReactElement} ui - Component to render
 * @param {Object} options - Render options
 * @param {Array<string>} options.initialEntries - Initial route entries
 * @param {number} options.initialIndex - Initial route index
 * @returns {Object} Render result
 */
export const renderWithMemoryRouter = (
  ui,
  { initialEntries = ['/'], initialIndex = 0, ...options } = {}
) => {
  const Wrapper = ({ children }) => (
    <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
      {children}
    </MemoryRouter>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

/**
 * Create a wrapper component that provides common context
 * @param {Object} options - Provider options
 * @returns {React.Component} Wrapper component
 */
export const createWrapper = ({ route = '/', useMemoryRouter = true } = {}) => {
  if (useMemoryRouter) {
    return ({ children }) => (
      <MemoryRouter initialEntries={[route]}>
        {children}
      </MemoryRouter>
    );
  }

  return ({ children }) => (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
};

/**
 * Re-export testing library utilities for convenience
 */
export { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
