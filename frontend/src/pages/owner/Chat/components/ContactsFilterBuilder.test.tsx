import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContactsFilterBuilder } from './ContactsFilterBuilder';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../../i18n/config', () => ({
  useTranslation: () => ({ t: (k: string, fb?: string) => fb || k }),
  t: (k: string, fb?: string) => fb || k,
}));

vi.mock('../../../../api/bot', () => ({
  getCustomFieldsApi: vi.fn(() => Promise.resolve([]))
}));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('ContactsFilterBuilder', () => {
  it('returns null when isOpen=false', async () => {
    const { container } = render(
      <ContactsFilterBuilder
        isOpen={false}
        conditions={[]}
        setConditions={vi.fn()}
        tags={[]}
        contacts={[]}
        botId={1}
      />,
      { wrapper: Wrapper }
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders filter builder when isOpen=true', async () => {
    render(
      <ContactsFilterBuilder
        isOpen={true}
        conditions={[]}
        setConditions={vi.fn()}
        tags={[]}
        contacts={[]}
        botId={1}
      />,
      { wrapper: Wrapper }
    );
    expect(await screen.findByText(/audience.panel.add_condition/i)).toBeInTheDocument();
  });
});
