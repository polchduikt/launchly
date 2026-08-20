import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBotsQuery } from '../useBotsQuery';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockSetActiveBotId = vi.fn();
vi.mock('../../../store/useBotStore', () => ({
  useBotStore: (selector?: (state: Record<string, unknown>) => unknown) =>
    selector
      ? selector({ activeBotId: null, setActiveBotId: mockSetActiveBotId })
      : { activeBotId: null, setActiveBotId: mockSetActiveBotId },
}));

vi.mock('../../../api/bot', () => ({
  getBotsApi: vi.fn().mockResolvedValue([{ id: 1, name: 'Main Bot' }]),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useBotsQuery', () => {
  it('fetches bots and auto-selects first bot if activeBotId is null', async () => {
    const { result } = renderHook(() => useBotsQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 1, name: 'Main Bot' }]);
    expect(mockSetActiveBotId).toHaveBeenCalledWith(1);
  });
});
