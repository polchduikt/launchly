import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useCreateBotMutation,
  useDeleteBotMutation,
  useStartBotMutation,
  useStopBotMutation,
  usePublishBotMutation,
  useUpdateBotMutation,
} from '../useBotMutations';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockSetActiveBotId = vi.fn();
vi.mock('../../../store/useBotStore', () => ({
  useBotStore: (selector: any) =>
    selector ? selector({ setActiveBotId: mockSetActiveBotId }) : { setActiveBotId: mockSetActiveBotId },
}));

vi.mock('../../../api/bot', () => ({
  createBotApi: vi.fn().mockResolvedValue({ id: 10, name: 'New Bot' }),
  deleteBotApi: vi.fn().mockResolvedValue(undefined),
  startBotApi: vi.fn().mockResolvedValue(undefined),
  stopBotApi: vi.fn().mockResolvedValue(undefined),
  publishBotApi: vi.fn().mockResolvedValue({ id: 10, name: 'New Bot', active: true }),
  updateBotApi: vi.fn().mockResolvedValue({ id: 10, name: 'Updated Bot' }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useBotMutations', () => {
  it('creates bot and updates active bot id', async () => {
    const { result } = renderHook(() => useCreateBotMutation(), {
      wrapper: createWrapper(),
    });

    const res = await result.current.mutateAsync({ name: 'New Bot' });

    expect(res).toEqual({ id: 10, name: 'New Bot' });
    expect(mockSetActiveBotId).toHaveBeenCalledWith(10);
  });

  it('handles delete, start, stop, publish and update mutations', async () => {
    const wrapper = createWrapper();
    const { result: delRes } = renderHook(() => useDeleteBotMutation(), { wrapper });
    const { result: startRes } = renderHook(() => useStartBotMutation(), { wrapper });
    const { result: stopRes } = renderHook(() => useStopBotMutation(), { wrapper });
    const { result: pubRes } = renderHook(() => usePublishBotMutation(), { wrapper });
    const { result: updRes } = renderHook(() => useUpdateBotMutation(), { wrapper });

    await delRes.current.mutateAsync(10);
    await startRes.current.mutateAsync(10);
    await stopRes.current.mutateAsync(10);
    const published = await pubRes.current.mutateAsync(10);
    const updated = await updRes.current.mutateAsync({ id: 10, data: { name: 'Updated Bot' } });

    expect(published).toEqual({ id: 10, name: 'New Bot', active: true });
    expect(updated).toEqual({ id: 10, name: 'Updated Bot' });
  });
});
