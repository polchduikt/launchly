import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ContactInfoPanel } from '../ContactInfoPanel';

vi.mock('../../../../../i18n/config', () => ({
  useTranslation: () => ({ t: (k: string, fb?: string) => fb || k }),
  t: (k: string, fb?: string) => fb || k,
}));

vi.mock('../../../../../hooks/crm/useCrmQueries', () => ({
  useUpdateBotUserMutation: () => ({ mutate: vi.fn() }),
  useDeleteBotUserMutation: () => ({ mutate: vi.fn() })
}));

vi.mock('../../../../../hooks/broadcast/useBroadcastQueries', () => ({
  useTagsQuery: () => ({ data: [], isLoading: false })
}));

vi.mock('../../../../../api/bot', () => ({
  getCustomFieldsApi: vi.fn(() => Promise.resolve([])),
  saveCustomFieldsApi: vi.fn(() => Promise.resolve())
}));

vi.mock('../../../../../api/broadcast', () => ({
  createTagApi: vi.fn()
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe('ContactInfoPanel', () => {
  it('renders button when isOpen=false', async () => {
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <ContactInfoPanel
            botId={1}
            conversation={{ id: 1, botId: 1, botUserName: 'Jane' } as unknown as never}
            isOpen={false}
            onClose={vi.fn()}
            onOpen={vi.fn()}
          />
        </MemoryRouter>
      </QueryClientProvider>
    );
    expect(await screen.findByRole('button')).toBeInTheDocument();
  });

  it('renders panel content when isOpen=true', async () => {
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <ContactInfoPanel
            botId={1}
            conversation={{ id: 1, botId: 1, botUserName: 'Jane' } as unknown as never}
            isOpen={true}
            onClose={vi.fn()}
            onOpen={vi.fn()}
          />
        </MemoryRouter>
      </QueryClientProvider>
    );
    expect((await screen.findAllByText('Jane')).length).toBeGreaterThan(0);
  });
});
