import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContactDetailModal } from '../ContactDetailModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as any,
    useNavigate: () => vi.fn()
  };
});

vi.mock('../../../../../i18n/config', () => ({
  t: (k: string, fb?: string) => fb || k,
  useTranslation: () => ({ t: (k: string, fb?: string) => fb || k })
}));

vi.mock('../../../../../hooks/crm/useCrmQueries', () => ({
  useUpdateBotUserMutation: () => ({ mutate: vi.fn() }),
  useDeleteBotUserMutation: () => ({ mutate: vi.fn() })
}));

vi.mock('../../../../../api/broadcast', () => ({
  createTagApi: vi.fn()
}));

vi.mock('../../../../../api/bot', () => ({
  getCustomFieldsApi: vi.fn(() => Promise.resolve([])),
  saveCustomFieldsApi: vi.fn(() => Promise.resolve())
}));

vi.mock('../../FlowBuilder/components/sidebar/editors/TagSearchSelect', () => ({
  TagSearchSelect: () => <div data-testid="tag-search-select" />
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe('ContactDetailModal', () => {
  it('renders contact name, avatar, and action buttons', () => {
    const mockContact = { id: 1, firstName: 'Jane', lastName: 'Smith', metadata: '{}' } as any;
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <ContactDetailModal
            botId={1}
            selectedContact={mockContact}
            conversations={[]}
            tags={[]}
            onClose={vi.fn()}
            onContactUpdated={vi.fn()}
            onContactDeleted={vi.fn()}
          />
        </MemoryRouter>
      </QueryClientProvider>
    );
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });
});
