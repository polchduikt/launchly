import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBroadcastBuilder } from '../useBroadcastBuilder';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactFlowProvider } from '@xyflow/react';
import React from 'react';

vi.mock('../../../store/useBotStore', () => ({
  useBotStore: (selector?: (state: Record<string, unknown>) => unknown) =>
    selector ? selector({ activeBotId: 1 }) : { activeBotId: 1 },
}));

vi.mock('../useBroadcastQueries', () => ({
  useTagsQuery: () => ({ data: [] }),
  useUpdateCampaignMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useSendCampaignMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../../crm/useCrmQueries', () => ({
  useLeadsQuery: () => ({ data: [] }),
  useOrdersQuery: () => ({ data: [] }),
}));

vi.mock('../../bot/useBotsQuery', () => ({
  useBotsQuery: () => ({ data: [{ id: 1, name: 'Bot 1' }], isLoading: false }),
}));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter initialEntries={['/broadcasts/1']}>
      <ReactFlowProvider>
        <Routes>
          <Route path="/broadcasts/:id" element={<>{children}</>} />
        </Routes>
      </ReactFlowProvider>
    </MemoryRouter>
  </QueryClientProvider>
);

describe('useBroadcastBuilder', () => {
  it('initializes broadcast canvas state', () => {
    const { result } = renderHook(() => useBroadcastBuilder(), { wrapper: Wrapper });

    expect(result.current.nodes).toBeDefined();
    expect(result.current.edges).toBeDefined();
    expect(result.current.messageText).toBeDefined();

    act(() => {
      result.current.setMessageText('Hello Audience');
    });

    expect(result.current.messageText).toBe('Hello Audience');
  });
});
