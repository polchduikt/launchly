import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IntegrationsPanel } from '../IntegrationsPanel';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>{children}</QueryClientProvider>
);

vi.mock('../../../hooks/integration/useIntegrationQueries', () => ({
  useIntegrationsQuery: () => ({ data: [], isLoading: false }),
}));

vi.mock('../GoogleSheetsCard', () => ({
  GoogleSheetsCard: () => <div data-testid="google-sheets-card" />,
}));
vi.mock('../HotmartCard', () => ({
  HotmartCard: () => <div data-testid="hotmart-card" />,
}));
vi.mock('../MailchimpCard', () => ({
  MailchimpCard: () => <div data-testid="mailchimp-card" />,
}));
vi.mock('../PremiumIntegrationCard', () => ({
  PremiumIntegrationCard: ({ name }: any) => <div data-testid={`premium-card-${name}`} />,
}));

vi.mock('../../../i18n/config', () => ({
  t: (k: string, fb?: string) => fb || k,
  useTranslation: () => ({ t: (k: string, fb?: string) => fb || k }),
}));

describe('IntegrationsPanel', () => {
  it('renders integrations panel', () => {
    render(<IntegrationsPanel botId={1} />, { wrapper: Wrapper });
    expect(screen.getByTestId('google-sheets-card')).toBeInTheDocument();
    expect(screen.getByTestId('hotmart-card')).toBeInTheDocument();
    expect(screen.getByTestId('mailchimp-card')).toBeInTheDocument();
    expect(screen.getByTestId('premium-card-ChatGPT')).toBeInTheDocument();
    expect(screen.getByTestId('premium-card-Claude')).toBeInTheDocument();
    expect(screen.getByTestId('premium-card-DeepSeek')).toBeInTheDocument();
    expect(screen.getByTestId('premium-card-Gemini')).toBeInTheDocument();
    expect(screen.getByText('HubSpot CRM')).toBeInTheDocument();
  });
});
