import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  useCampaignsQuery,
  useTagsQuery,
  useCreateCampaignMutation,
  useUpdateCampaignMutation,
  useSendCampaignMutation,
  useDeleteCampaignMutation,
} from './useBroadcastQueries';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('../../api/broadcast', () => ({
  getCampaignsApi: vi.fn().mockResolvedValue([{ id: 1, name: 'Campaign 1', status: 'COMPLETED' }]),
  getTagsApi: vi.fn().mockResolvedValue([{ id: 1, name: 'Tag 1' }]),
  createCampaignApi: vi.fn().mockResolvedValue({ id: 2, name: 'New Campaign' }),
  updateCampaignApi: vi.fn().mockResolvedValue({ id: 1, name: 'Updated Campaign' }),
  sendCampaignApi: vi.fn().mockResolvedValue({ success: true }),
  deleteCampaignApi: vi.fn().mockResolvedValue({ success: true }),
  cancelScheduleApi: vi.fn().mockResolvedValue({ success: true }),
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

describe('useBroadcastQueries', () => {
  it('fetches campaigns and tags by botId', async () => {
    const wrapper = createWrapper();
    const { result: campRes } = renderHook(() => useCampaignsQuery(1), { wrapper });
    const { result: tagsRes } = renderHook(() => useTagsQuery(1), { wrapper });

    await waitFor(() => expect(campRes.current.isSuccess).toBe(true));
    await waitFor(() => expect(tagsRes.current.isSuccess).toBe(true));

    expect(campRes.current.data).toEqual([{ id: 1, name: 'Campaign 1', status: 'COMPLETED' }]);
    expect(tagsRes.current.data).toEqual([{ id: 1, name: 'Tag 1' }]);
  });

  it('runs campaign mutations', async () => {
    const wrapper = createWrapper();
    const { result: createRes } = renderHook(() => useCreateCampaignMutation(1), { wrapper });
    const { result: updRes } = renderHook(() => useUpdateCampaignMutation(1), { wrapper });
    const { result: sendRes } = renderHook(() => useSendCampaignMutation(), { wrapper });
    const { result: delRes } = renderHook(() => useDeleteCampaignMutation(), { wrapper });

    const created = await createRes.current.mutateAsync({ name: 'New Campaign' } as unknown as never);
    const updated = await updRes.current.mutateAsync({ campaignId: 1, req: { name: 'Updated Campaign' } as unknown as never });
    const sent = await sendRes.current.mutateAsync(1);
    const deleted = await delRes.current.mutateAsync({ campaignId: 1, botId: 1 });

    expect(created).toEqual({ id: 2, name: 'New Campaign' });
    expect(updated).toEqual({ id: 1, name: 'Updated Campaign' });
    expect(sent).toEqual({ success: true });
    expect(deleted).toEqual({ success: true });
  });
});
