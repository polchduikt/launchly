import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WebhookCard } from '../WebhookCard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>{children}</QueryClientProvider>
);

vi.mock('../../../hooks/integration/useIntegrationQueries', () => ({
  useCreateIntegrationMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateIntegrationMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useToggleIntegrationMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteIntegrationMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../../../i18n/config', () => ({
  t: (k: string, fb?: string) => fb || k,
  useTranslation: () => ({ t: (k: string, fb?: string) => fb || k }),
}));

describe('WebhookCard', () => {
  it('renders webhook card', () => {
    render(<WebhookCard botId={1} integration={undefined} />, { wrapper: Wrapper });
    expect(screen.getByText('settings.integrations.webhook.title')).toBeInTheDocument();
  });
});
