import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  useIntegrationsQuery,
  useCreateIntegrationMutation,
  useUpdateIntegrationMutation,
  useDeleteIntegrationMutation,
  useToggleIntegrationMutation,
} from '../useIntegrationQueries';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('../../../api/integration', () => ({
  getIntegrationsApi: vi.fn().mockResolvedValue([{ id: 1, type: 'TELEGRAM' }]),
  createIntegrationApi: vi.fn().mockResolvedValue({ id: 2, type: 'OPENAI' }),
  updateIntegrationApi: vi.fn().mockResolvedValue({ id: 1, type: 'TELEGRAM' }),
  deleteIntegrationApi: vi.fn().mockResolvedValue({ success: true }),
  toggleIntegrationApi: vi.fn().mockResolvedValue({ id: 1, enabled: true }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useIntegrationQueries', () => {
  it('fetches integrations list', async () => {
    const { result } = renderHook(() => useIntegrationsQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 1, type: 'TELEGRAM' }]);
  });

  it('handles integration mutations', async () => {
    const wrapper = createWrapper();
    const { result: createRes } = renderHook(() => useCreateIntegrationMutation(), { wrapper });
    const { result: updRes } = renderHook(() => useUpdateIntegrationMutation(), { wrapper });
    const { result: delRes } = renderHook(() => useDeleteIntegrationMutation(), { wrapper });
    const { result: toggleRes } = renderHook(() => useToggleIntegrationMutation(), { wrapper });

    const created = await createRes.current.mutateAsync({ type: 'OPENAI' } as unknown as never);
    const updated = await updRes.current.mutateAsync({ id: 1, request: { type: 'TELEGRAM' } as unknown as never });
    const deleted = await delRes.current.mutateAsync(1);
    const toggled = await toggleRes.current.mutateAsync(1);

    expect(created).toEqual({ id: 2, type: 'OPENAI' });
    expect(updated).toEqual({ id: 1, type: 'TELEGRAM' });
    expect(deleted).toEqual({ success: true });
    expect(toggled).toEqual({ id: 1, enabled: true });
  });
});
