import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCrmWebSocket } from '../useCrmWebSocket';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockActivate = vi.fn();
const mockDeactivate = vi.fn();
const mockSubscribe = vi.fn();

vi.mock('@stomp/stompjs', () => {
  return {
    Client: class MockClient {
      activate = mockActivate;
      deactivate = mockDeactivate;
      subscribe = mockSubscribe;
      onConnect = vi.fn();
    },
  };
});

vi.mock('sockjs-client', () => {
  return {
    default: class MockSockJS {},
  };
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useCrmWebSocket', () => {
  it('activates STOMP client on mount and deactivates on unmount', () => {
    const { unmount } = renderHook(() => useCrmWebSocket(1), {
      wrapper: createWrapper(),
    });

    expect(mockActivate).toHaveBeenCalled();

    unmount();

    expect(mockDeactivate).toHaveBeenCalled();
  });

  it('does nothing when botId is 0 or negative', () => {
    mockActivate.mockClear();

    renderHook(() => useCrmWebSocket(0), {
      wrapper: createWrapper(),
    });

    expect(mockActivate).not.toHaveBeenCalled();
  });
});
