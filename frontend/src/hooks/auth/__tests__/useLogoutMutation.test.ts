import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLogoutMutation } from '../useLogoutMutation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockLogout = vi.fn();
vi.mock('../../../store/useAuthStore', () => ({
  useAuthStore: (selector?: (state: Record<string, unknown>) => unknown) =>
    selector
      ? selector({ logout: mockLogout, refreshToken: 'sample_refresh_token' })
      : { logout: mockLogout, refreshToken: 'sample_refresh_token' },
}));

vi.mock('../../../api/auth', () => ({
  logoutApi: vi.fn().mockResolvedValue(undefined),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useLogoutMutation', () => {
  it('calls logoutApi and calls logout in store', async () => {
    const { result } = renderHook(() => useLogoutMutation(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync();

    expect(mockLogout).toHaveBeenCalled();
  });
});
