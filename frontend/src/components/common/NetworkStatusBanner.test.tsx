import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { NetworkStatusBanner } from './NetworkStatusBanner';
import { useNetworkStore } from '../../store/useNetworkStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('../../i18n/config', () => ({
  t: (_k: string, fallback?: string) => fallback || _k,
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('NetworkStatusBanner', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useNetworkStore.setState({
      isOnline: true,
      webSocketStatus: 'connected',
      hasBeenOffline: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when online and connected', () => {
    const { container } = render(<NetworkStatusBanner />, { wrapper: createWrapper() });
    expect(container.firstChild).toBeNull();
  });

  it('renders offline alert when browser is offline', () => {
    useNetworkStore.setState({ isOnline: false });
    render(<NetworkStatusBanner />, { wrapper: createWrapper() });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(
      screen.getByText(/Відсутнє підключення до Інтернету/i)
    ).toBeInTheDocument();
  });

  it('renders reconnecting alert after debounce when webSocketStatus is reconnecting after being offline', () => {
    vi.useFakeTimers();
    useNetworkStore.setState({
      isOnline: true,
      webSocketStatus: 'reconnecting',
      hasBeenOffline: true,
    });

    render(<NetworkStatusBanner />, { wrapper: createWrapper() });

    act(() => {
      vi.advanceTimersByTime(1300);
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(
      screen.getByText(/З'єднання в реальному часі втрачено/i)
    ).toBeInTheDocument();
  });

  it('does not render alert when webSocketStatus is disconnected', () => {
    useNetworkStore.setState({
      isOnline: true,
      webSocketStatus: 'disconnected',
      hasBeenOffline: false,
    });

    const { container } = render(<NetworkStatusBanner />, { wrapper: createWrapper() });
    expect(container.firstChild).toBeNull();
  });

  it('shows connection restored status on online event', () => {
    render(<NetworkStatusBanner />, { wrapper: createWrapper() });

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(
      screen.getByText(/Підключення відновлено/i)
    ).toBeInTheDocument();
  });
});
