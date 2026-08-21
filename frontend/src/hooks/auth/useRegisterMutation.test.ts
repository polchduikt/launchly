import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRegisterMutation } from './useRegisterMutation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockLogin = vi.fn();
vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: (selector?: (state: Record<string, unknown>) => unknown) =>
    selector ? selector({ login: mockLogin }) : { login: mockLogin },
}));

vi.mock('../../api/auth', () => ({
  registerApi: vi.fn().mockResolvedValue({
    accessToken: 'reg_acc_token',
    refreshToken: 'reg_ref_token',
    user: { id: 2, email: 'new@launchly.app' },
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useRegisterMutation', () => {
  it('calls registerApi and stores credentials on success', async () => {
    const { result } = renderHook(() => useRegisterMutation(), {
      wrapper: createWrapper(),
    });

    const res = await result.current.mutateAsync({
      email: 'new@launchly.app',
      password: 'password123',
      name: 'New User',
    });

    expect(res.accessToken).toBe('reg_acc_token');
    expect(mockLogin).toHaveBeenCalledWith('reg_acc_token', 'reg_ref_token', {
      id: 2,
      email: 'new@launchly.app',
    });
  });
});
