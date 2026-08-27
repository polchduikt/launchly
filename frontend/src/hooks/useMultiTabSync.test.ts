import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMultiTabSync } from './useMultiTabSync';
import { useAuthStore } from '../store/useAuthStore';
import { useBotStore } from '../store/useBotStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useMultiTabSync', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({
      accessToken: 'initial_token',
      refreshToken: 'initial_refresh',
      user: { id: 1, email: 'test@launchly.com' } as never,
    });
    useBotStore.setState({ activeBotId: 1 });
  });

  it('synchronizes logout event from external tab', () => {
    renderHook(() => useMultiTabSync(), { wrapper: createWrapper() });

    act(() => {
      const storageEvent = new StorageEvent('storage', {
        key: 'launchly_multitab_sync_event',
        newValue: JSON.stringify({
          type: 'AUTH_LOGOUT',
          senderTabId: 'other-tab-id',
          timestamp: Date.now(),
        }),
      });
      window.dispatchEvent(storageEvent);
    });

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
    expect(useBotStore.getState().activeBotId).toBeNull();
  });

  it('synchronizes bot change event from external tab', () => {
    renderHook(() => useMultiTabSync(), { wrapper: createWrapper() });

    act(() => {
      const storageEvent = new StorageEvent('storage', {
        key: 'launchly_multitab_sync_event',
        newValue: JSON.stringify({
          type: 'BOT_CHANGED',
          payload: { botId: 42 },
          senderTabId: 'other-tab-id',
          timestamp: Date.now(),
        }),
      });
      window.dispatchEvent(storageEvent);
    });

    expect(useBotStore.getState().activeBotId).toBe(42);
  });
});
