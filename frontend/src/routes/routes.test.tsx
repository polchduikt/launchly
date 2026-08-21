import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AppRouter } from './index';
import { ROUTES } from './paths';
import { useAuthStore } from '../store/useAuthStore';

vi.mock('../store/useAuthStore', () => {
  let state = {
    accessToken: null,
    user: null,
    setUser: vi.fn(),
  };
  const useAuthStoreMock = (selector?: (state: Record<string, unknown>) => unknown) => (selector ? selector(state) : state);
  useAuthStoreMock.setState = (newState: Record<string, unknown>) => {
    state = { ...state, ...newState };
  };
  useAuthStoreMock.getState = () => state;
  return { useAuthStore: useAuthStoreMock };
});

vi.mock('../api/auth', () => ({
  getCurrentUserApi: vi.fn().mockResolvedValue({ id: 1, email: 'user@launchly.app', role: 'ROLE_USER' }),
}));

vi.mock('../pages/public/Landing/LandingPage', () => ({
  default: () => <div>Landing Page Content</div>,
}));

describe('AppRouter & Route Guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as unknown as { setState: (s: Record<string, unknown>) => void }).setState({
      accessToken: null,
      user: null,
    });
  });

  it('verifies ROUTES constants are correctly defined', () => {
    expect(ROUTES.LANDING).toBe('/');
    expect(ROUTES.LOGIN).toBe('/login');
    expect(ROUTES.REGISTER).toBe('/register');
    expect(ROUTES.DASHBOARD).toBe('/dashboard');
    expect(ROUTES.ADMIN_HOME).toBe('/admin');
  });

  it('renders landing page on root route', async () => {
    window.history.pushState({}, 'Test', '/');

    render(<AppRouter />);

    await waitFor(() => {
      expect(screen.getByText('Landing Page Content')).toBeInTheDocument();
    });
  });
});
