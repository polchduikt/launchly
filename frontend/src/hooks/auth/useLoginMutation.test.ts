import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLoginMutation } from './useLoginMutation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockLogin = vi.fn();
vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: (selector?: (state: Record<string, unknown>) => unknown) =>
    selector ? selector({ login: mockLogin }) : { login: mockLogin },
}));

vi.mock('../../api/auth', () => ({
  loginApi: vi.fn().mockResolvedValue({
    accessToken: 'acc_token',
    refreshToken: 'ref_token',
    user: { id: 1, email: 'user@launchly.app' },
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useLoginMutation', () => {
  it('calls loginApi and updates auth store on success', async () => {
    const { result } = renderHook(() => useLoginMutation(), {
      wrapper: createWrapper(),
    });

    const res = await result.current.mutateAsync({
      email: 'user@launchly.app',
      password: 'password123',
    });

    expect(res.accessToken).toBe('acc_token');
    expect(mockLogin).toHaveBeenCalledWith('acc_token', 'ref_token', {
      id: 1,
      email: 'user@launchly.app',
    });
  });
});
