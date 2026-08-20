import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MailchimpCard } from '../MailchimpCard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>{children}</QueryClientProvider>
);

vi.mock('../../../hooks/integration/useIntegrationQueries', () => ({
  useCreateIntegrationMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteIntegrationMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('../../../i18n/config', () => ({
  t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k) }),
}));

describe('MailchimpCard', () => {
  it('renders Mailchimp card', () => {
    render(<MailchimpCard botId={1} />, { wrapper: Wrapper });
    expect(screen.getByText(/Mailchimp Email Marketing|settings\.integrations\.mailchimp\.title/i)).toBeInTheDocument();
  });
});
