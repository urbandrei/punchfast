/**
 * Mock for react-router-dom
 */

const mockNavigate = jest.fn();

module.exports = {
  useNavigate: () => mockNavigate,
  BrowserRouter: ({ children }) => children,
  MemoryRouter: ({ children }) => children,
  Link: ({ children, to, className, title, ...rest }) => (
    <a href={to} className={className} title={title} {...rest}>{children}</a>
  ),
  NavLink: ({ children, to, className, title, ...rest }) => (
    <a href={to} className={className} title={title} {...rest}>{children}</a>
  ),
  useLocation: () => ({ pathname: '/', search: '', hash: '', state: null }),
  useParams: () => ({}),
  Routes: ({ children }) => <div>{children}</div>,
  Route: ({ element }) => element,
  Outlet: () => null,
  __mockNavigate: mockNavigate
};
