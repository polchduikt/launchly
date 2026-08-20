import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFlowBuilder } from '../useFlowBuilder';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactFlowProvider } from '@xyflow/react';
import React from 'react';

vi.mock('../../../store/useBotStore', () => ({
  useBotStore: (selector?: (state: Record<string, unknown>) => unknown) =>
    selector ? selector({ activeBotId: 1, setActiveBotId: vi.fn() }) : { activeBotId: 1, setActiveBotId: vi.fn() },
}));

vi.mock('../useFlowSchema', () => ({
  useFlowSchemaQuery: () => ({
    data: { id: 1, version: 1, nodes: [], edges: [] },
    isLoading: false,
  }),
  useSaveFlowSchemaMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter>
      <ReactFlowProvider>{children}</ReactFlowProvider>
    </MemoryRouter>
  </QueryClientProvider>
);

describe('useFlowBuilder', () => {
  it('manages flow builder node and dropdown states', () => {
    const { result } = renderHook(() => useFlowBuilder(), { wrapper: Wrapper });

    expect(result.current.nodes).toBeDefined();
    expect(result.current.edges).toBeDefined();
    expect(result.current.isAddDropdownOpen).toBe(false);

    act(() => {
      result.current.setIsAddDropdownOpen(true);
      result.current.setSelectedNodeId('node_123');
    });

    expect(result.current.isAddDropdownOpen).toBe(true);
    expect(result.current.selectedNodeId).toBe('node_123');
  });
});
