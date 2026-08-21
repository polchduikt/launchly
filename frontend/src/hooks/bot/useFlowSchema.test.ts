import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFlowSchemaQuery, useSaveFlowSchemaMutation } from './useFlowSchema';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('../../api/bot', () => ({
  getFlowSchemaApi: vi.fn().mockResolvedValue({ id: 1, version: 1, nodes: [], edges: [] }),
  saveFlowSchemaApi: vi.fn().mockResolvedValue({ id: 1, version: 2, nodes: [], edges: [] }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useFlowSchema', () => {
  it('fetches flow schema by bot id', async () => {
    const { result } = renderHook(() => useFlowSchemaQuery(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.version).toBe(1);
  });

  it('saves flow schema mutation', async () => {
    const { result } = renderHook(() => useSaveFlowSchemaMutation(1), {
      wrapper: createWrapper(),
    });

    const res = await result.current.mutateAsync({ nodes: [], edges: [] });
    expect(res.version).toBe(2);
  });
});
