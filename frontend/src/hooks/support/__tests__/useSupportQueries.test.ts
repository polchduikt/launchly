import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  useUserTicketsQuery,
  useUserTicketDetailQuery,
  useCreateTicketMutation,
  useSendTicketMessageMutation,
  useUpdateTicketStatusMutation,
} from '../useSupportQueries';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('../../../api/support', () => ({
  getUserTicketsApi: vi.fn().mockResolvedValue([{ id: 1, subject: 'Need Help' }]),
  getUserTicketDetailApi: vi.fn().mockResolvedValue({ id: 1, subject: 'Need Help', messages: [] }),
  createTicketApi: vi.fn().mockResolvedValue({ id: 2, subject: 'New Ticket' }),
  sendTicketMessageApi: vi.fn().mockResolvedValue({ id: 10, text: 'Message sent' }),
  updateTicketStatusApi: vi.fn().mockResolvedValue({ id: 1, status: 'CLOSED' }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useSupportQueries', () => {
  it('fetches tickets and ticket detail', async () => {
    const wrapper = createWrapper();
    const { result: ticketsRes } = renderHook(() => useUserTicketsQuery(), { wrapper });
    const { result: detailRes } = renderHook(() => useUserTicketDetailQuery(1), { wrapper });

    await waitFor(() => expect(ticketsRes.current.isSuccess).toBe(true));
    await waitFor(() => expect(detailRes.current.isSuccess).toBe(true));

    expect(ticketsRes.current.data).toEqual([{ id: 1, subject: 'Need Help' }]);
    expect(detailRes.current.data?.subject).toBe('Need Help');
  });

  it('handles support mutations', async () => {
    const wrapper = createWrapper();
    const { result: createRes } = renderHook(() => useCreateTicketMutation(), { wrapper });
    const { result: sendRes } = renderHook(() => useSendTicketMessageMutation(1), { wrapper });
    const { result: updateRes } = renderHook(() => useUpdateTicketStatusMutation(1), { wrapper });

    const created = await createRes.current.mutateAsync({ subject: 'New Ticket' } as any);
    const sent = await sendRes.current.mutateAsync('Hello support');
    const updated = await updateRes.current.mutateAsync('CLOSED');

    expect(created).toEqual({ id: 2, subject: 'New Ticket' });
    expect(sent).toEqual({ id: 10, text: 'Message sent' });
    expect(updated).toEqual({ id: 1, status: 'CLOSED' });
  });
});
