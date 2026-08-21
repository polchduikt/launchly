import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PaymentsPanel } from './PaymentsPanel';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>{children}</QueryClientProvider>
);

vi.mock('../../store/useBotStore', () => ({
  useBotStore: (selector?: (state: Record<string, unknown>) => unknown) => selector ? selector({ activeBotId: 1 }) : { activeBotId: 1 },
}));

vi.mock('../../hooks/integration/useIntegrationQueries', () => ({
  useIntegrationsQuery: () => ({ data: [] }),
  useCreateIntegrationMutation: () => ({ mutateAsync: vi.fn() }),
  useDeleteIntegrationMutation: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('../../i18n/config', () => ({
  t: (k: string, fb?: string) => fb || k,
  useTranslation: () => ({ t: (k: string, fb?: string) => fb || k }),
}));

describe('PaymentsPanel', () => {
  it('renders payments panel', () => {
    render(<PaymentsPanel />, { wrapper: Wrapper });
    expect(screen.getByText('settings.payments.stripe.title')).toBeInTheDocument();
    expect(screen.getByText('settings.payments.paypal.title')).toBeInTheDocument();
    expect(screen.getByText('settings.payments.currency.title')).toBeInTheDocument();
  });
});
