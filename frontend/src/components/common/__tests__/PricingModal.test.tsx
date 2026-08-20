import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PricingModal } from '../PricingModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>{children}</QueryClientProvider>
);

vi.mock('../../../hooks/bot/useBillingQueries', () => ({
  usePlansQuery: () => ({ data: [], isLoading: false }),
  useSubscriptionQuery: () => ({ data: null }),
  useCheckoutMutation: () => ({ mutate: vi.fn() }),
  useCancelSubscriptionMutation: () => ({ mutate: vi.fn() }),
}));

vi.mock('../../../i18n/config', () => ({
  t: (k: string, fb?: string) => fb || k,
  useTranslation: () => ({ t: (k: string, fb?: string) => fb || k }),
}));

describe('PricingModal', () => {
  it('returns null when isOpen is false', () => {
    const { container } = render(<PricingModal isOpen={false} onClose={() => {}} />, { wrapper: Wrapper });
    expect(container).toBeEmptyDOMElement();
  });

  it('renders pricing modal when isOpen is true', () => {
    render(<PricingModal isOpen={true} onClose={() => {}} />, { wrapper: Wrapper });
    expect(screen.getByText('pricing.header')).toBeInTheDocument();
  });
});
