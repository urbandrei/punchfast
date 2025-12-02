/**
 * Test Utilities Index - Re-export all test helpers
 */

// Mock data factories
export {
  createMockUser,
  createMockBusinessUser,
  createMockStore,
  createMockRoute,
  createMockAchievement,
  createMockVisit,
  createMockQuestion,
  createMockTokens,
  createMockPunchcard,
  createMockRouteStart,
  createMockSavedStore
} from './mock-data';

// API mocking utilities
export {
  createMockFetch,
  createDefaultApiResponses,
  setupFetchMock,
  resetFetchMock
} from './mock-api';

// Geolocation mocking utilities
export {
  createMockGeolocation,
  setupGeolocationMock,
  createPosition
} from './mock-geolocation';

// Render helpers
export {
  renderWithRouter,
  renderWithMemoryRouter,
  createWrapper,
  render,
  screen,
  fireEvent,
  waitFor,
  within,
  userEvent
} from './render-helpers';
