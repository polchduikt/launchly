import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  useOrdersQuery,
  useLeadsQuery,
  useConversationsQuery,
  useConversationQuery,
  useMessagesQuery,
  useSendMessageMutation,
  useUpdateOrderMutation,
} from './useCrmQueries';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('../../api/crm', () => ({
  getOrdersApi: vi.fn().mockResolvedValue([{ id: 1, total: 100 }]),
  getLeadsApi: vi.fn().mockResolvedValue([{ id: 1, name: 'Lead 1' }]),
  getConversationsApi: vi.fn().mockResolvedValue([{ id: 1, botUserName: 'Alice' }]),
  getConversationApi: vi.fn().mockResolvedValue({ id: 1, botUserName: 'Alice' }),
  getMessagesApi: vi.fn().mockResolvedValue([{ id: 1, content: 'Hello' }]),
  sendOwnerMessageApi: vi.fn().mockResolvedValue({ id: 2, content: 'Reply' }),
  updateOrderApi: vi.fn().mockResolvedValue({ id: 1, status: 'COMPLETED' }),
}));

vi.mock('../bot/useBotsQuery', () => ({
  useBotsQuery: () => ({ data: [{ id: 1, name: 'Bot 1' }], isLoading: false }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useCrmQueries', () => {
  it('fetches orders, leads, conversations, and messages', async () => {
    const wrapper = createWrapper();
    const { result: ordersRes } = renderHook(() => useOrdersQuery(1), { wrapper });
    const { result: leadsRes } = renderHook(() => useLeadsQuery(1), { wrapper });
    const { result: convsRes } = renderHook(() => useConversationsQuery(1), { wrapper });
    const { result: convRes } = renderHook(() => useConversationQuery(1), { wrapper });
    const { result: msgsRes } = renderHook(() => useMessagesQuery(1), { wrapper });

    await waitFor(() => expect(ordersRes.current.isSuccess).toBe(true));
    await waitFor(() => expect(leadsRes.current.isSuccess).toBe(true));
    await waitFor(() => expect(convsRes.current.isSuccess).toBe(true));
    await waitFor(() => expect(convRes.current.isSuccess).toBe(true));
    await waitFor(() => expect(msgsRes.current.isSuccess).toBe(true));

    expect(ordersRes.current.data).toEqual([{ id: 1, total: 100 }]);
    expect(leadsRes.current.data).toEqual([{ id: 1, name: 'Lead 1' }]);
    expect(convsRes.current.data).toEqual([{ id: 1, botUserName: 'Alice' }]);
    expect(msgsRes.current.data).toEqual([{ id: 1, content: 'Hello' }]);
  });

  it('runs CRM mutations', async () => {
    const wrapper = createWrapper();
    const { result: sendRes } = renderHook(() => useSendMessageMutation(1, 1), { wrapper });
    const { result: orderRes } = renderHook(() => useUpdateOrderMutation(1), { wrapper });

    const sent = await sendRes.current.mutateAsync({ content: 'Reply' });
    const upd = await orderRes.current.mutateAsync({ orderId: 1, status: 'COMPLETED' as unknown as never, notes: 'Done' });

    expect(sent).toEqual({ id: 2, content: 'Reply' });
    expect(upd).toEqual({ id: 1, status: 'COMPLETED' });
  });
});
