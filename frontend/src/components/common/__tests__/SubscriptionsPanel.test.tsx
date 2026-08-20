import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SubscriptionsPanel } from '../SubscriptionsPanel';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>{children}</QueryClientProvider>
);

vi.mock('../../../hooks/bot/useBillingQueries', () => ({
  useSubscriptionQuery: () => ({
    data: {
      plan: { name: 'Pro', displayName: 'Pro', price: 19, maxBotUsers: 1000 },
      cancelAtPeriodEnd: false,
    },
    isLoading: false,
    error: null,
  }),
  useCancelSubscriptionMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useResumeSubscriptionMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../../../hooks/crm/useCrmQueries', () => ({
  useAllBotUsersQuery: () => ({ data: [] }),
}));

vi.mock('../PricingModal', () => ({
  PricingModal: () => <div data-testid="pricing-modal" />,
}));

vi.mock('../../../i18n/config', () => ({
  t: (k: string, fb?: string) => fb || k,
  useTranslation: () => ({ t: (k: string, fb?: string) => fb || k }),
}));

describe('SubscriptionsPanel', () => {
  it('renders subscriptions panel', () => {
    render(<SubscriptionsPanel />, { wrapper: Wrapper });
    expect(screen.getByText('settings.billing.your_plan')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
  });
});
