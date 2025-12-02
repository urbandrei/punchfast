// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// ============================================================================
// Global Mocks for Testing
// ============================================================================

// Mock window.matchMedia (used by some components for responsive behavior)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver (needed for OpenLayers and other map components)
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver (used for lazy loading and visibility detection)
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

// Mock scrollIntoView (used by various components)
Element.prototype.scrollIntoView = jest.fn();

// Mock scrollTo
window.scrollTo = jest.fn();

// Mock requestAnimationFrame (used by animation hooks)
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 0));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

// Mock MorphingCard component to avoid animation complexity in tests
jest.mock('./components/MorphingCard', () => {
  return function MockMorphingCard({ children, className, style, onClick, ...props }) {
    return (
      <div className={className} style={style} onClick={onClick} data-testid="morphing-card" {...props}>
        {children}
      </div>
    );
  };
});

// Mock WaveDecoration component
jest.mock('./components/WaveDecoration', () => {
  return function MockWaveDecoration() {
    return <div data-testid="wave-decoration" />;
  };
});

// Mock localStorage with working implementation
// Create a class that maintains internal state
class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] ?? null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }

  get length() {
    return Object.keys(this.store).length;
  }

  key(index) {
    return Object.keys(this.store)[index] ?? null;
  }
}

const localStorageMock = new LocalStorageMock();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Reset localStorage before each test
beforeEach(() => {
  localStorageMock.clear();
});

// Mock console.error to track but not spam test output
// (uncomment if you want to suppress expected errors)
// const originalError = console.error;
// beforeAll(() => {
//   console.error = jest.fn();
// });
// afterAll(() => {
//   console.error = originalError;
// });

// Suppress specific React warnings in tests (optional)
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = (...args) => {
    // Suppress React Router future flag warnings in tests
    if (args[0]?.includes?.('React Router Future Flag Warning')) {
      return;
    }
    originalWarn.apply(console, args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
});
