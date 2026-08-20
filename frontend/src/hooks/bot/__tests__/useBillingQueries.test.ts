import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  usePlansQuery,
  useSubscriptionQuery,
  useCheckoutMutation,
  useCancelSubscriptionMutation,
  useResumeSubscriptionMutation,
  useConfirmSessionMutation,
} from '../useBillingQueries';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('../../../api/billing', () => ({
  getPlansApi: vi.fn().mockResolvedValue([{ id: 1, name: 'Pro' }]),
  getSubscriptionApi: vi.fn().mockResolvedValue({ status: 'ACTIVE' }),
  checkoutApi: vi.fn().mockResolvedValue({ checkoutUrl: 'https://stripe.com' }),
  cancelSubscriptionApi: vi.fn().mockResolvedValue({ success: true }),
  resumeSubscriptionApi: vi.fn().mockResolvedValue({ success: true }),
  confirmSessionApi: vi.fn().mockResolvedValue({ confirmed: true }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useBillingQueries', () => {
  it('fetches plans and subscription data', async () => {
    const wrapper = createWrapper();
    const { result: plansRes } = renderHook(() => usePlansQuery(), { wrapper });
    const { result: subRes } = renderHook(() => useSubscriptionQuery(), { wrapper });

    await waitFor(() => expect(plansRes.current.isSuccess).toBe(true));
    await waitFor(() => expect(subRes.current.isSuccess).toBe(true));

    expect(plansRes.current.data).toEqual([{ id: 1, name: 'Pro' }]);
    expect(subRes.current.data).toEqual({ status: 'ACTIVE' });
  });

  it('runs billing mutations', async () => {
    const wrapper = createWrapper();
    const { result: checkoutRes } = renderHook(() => useCheckoutMutation(), { wrapper });
    const { result: cancelRes } = renderHook(() => useCancelSubscriptionMutation(), { wrapper });
    const { result: resumeRes } = renderHook(() => useResumeSubscriptionMutation(), { wrapper });
    const { result: confirmRes } = renderHook(() => useConfirmSessionMutation(), { wrapper });

    const chk = await checkoutRes.current.mutateAsync(1);
    const cnl = await cancelRes.current.mutateAsync();
    const rsm = await resumeRes.current.mutateAsync();
    const cnf = await confirmRes.current.mutateAsync('sess_123');

    expect(chk).toEqual({ checkoutUrl: 'https://stripe.com' });
    expect(cnl).toEqual({ success: true });
    expect(rsm).toEqual({ success: true });
    expect(cnf).toEqual({ confirmed: true });
  });
});
