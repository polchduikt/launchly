import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContactsPage } from '../ContactsPage';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../../i18n/config', () => ({
  t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k) }),
  getLanguage: () => 'uk',
}));

vi.mock('../../../../hooks/crm/useCrmQueries', () => ({
  useAllBotUsersQuery: () => ({ data: [], isLoading: false, refetch: vi.fn() }),
  useConversationsQuery: () => ({ data: [] }),
  useUpdateBotUserMutation: () => ({ mutate: vi.fn() }),
  useDeleteBotUserMutation: () => ({ mutate: vi.fn() }),
  useCreateBotUserMutation: () => ({ mutate: vi.fn() }),
}));

vi.mock('../../../../hooks/broadcast/useBroadcastQueries', () => ({
  useAllTagsQuery: () => ({ data: [] }),
}));

vi.mock('../../../../hooks/bot/useBotsQuery', () => ({
  useBotsQuery: () => ({ data: [{ id: 1, name: 'Bot 1' }], isLoading: false }),
}));

vi.mock('../../../../store/useBotStore', () => ({
  useBotStore: (selector: any) =>
    selector ? selector({ activeBotId: 1 }) : { activeBotId: 1 },
}));

vi.mock('../../../../components/layout/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-layout">{children}</div>
  ),
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('ContactsPage', () => {
  it('renders contacts management layout', () => {
    render(<ContactsPage />, { wrapper: Wrapper });

    expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
  });
});
