import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDashboardStatsQuery } from '../useDashboardStatsQuery';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('../../../api/dashboard', () => ({
  getDashboardStatsApi: vi.fn().mockResolvedValue({
    totalUsers: 50,
    activeUsers: 30,
    totalMessages: 1200,
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useDashboardStatsQuery', () => {
  it('fetches dashboard statistics for bot', async () => {
    const { result } = renderHook(() => useDashboardStatsQuery(1, 7), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      totalUsers: 50,
      activeUsers: 30,
      totalMessages: 1200,
    });
  });
});
