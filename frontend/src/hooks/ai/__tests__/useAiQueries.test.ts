import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAiUsageQuery, useAiChatMutation, useAiSchemaMutation } from '../useAiQueries';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('../../../api/ai', () => ({
  getAiUsageApi: vi.fn().mockResolvedValue({ used: 10, total: 100, remainingPercentage: 90 }),
  chatApi: vi.fn().mockResolvedValue({ message: 'Hello from AI' }),
  generateSchemaApi: vi.fn().mockResolvedValue({ nodes: [], edges: [] }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useAiQueries', () => {
  it('fetches AI usage stats', async () => {
    const { result } = renderHook(() => useAiUsageQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.remainingPercentage).toBe(90);
  });

  it('runs AI chat and schema mutations', async () => {
    const wrapper = createWrapper();
    const { result: chatRes } = renderHook(() => useAiChatMutation(), { wrapper });
    const { result: schemaRes } = renderHook(() => useAiSchemaMutation(), { wrapper });

    const chatData = await chatRes.current.mutateAsync({ message: 'Hi' } as unknown as never);
    const schemaData = await schemaRes.current.mutateAsync({ prompt: 'Generate bot' } as unknown as never);

    expect(chatData).toEqual({ message: 'Hello from AI' });
    expect(schemaData).toEqual({ nodes: [], edges: [] });
  });
});
