import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardPage } from '../DashboardPage';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../../i18n/config', () => ({
  t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k) }),
  getLanguage: () => 'uk',
}));

vi.mock('../../../../hooks/bot/useBotsQuery', () => ({
  useBotsQuery: () => ({ data: [{ id: 1, name: 'Bot 1' }], isLoading: false }),
}));

vi.mock('../../../../hooks/crm/useCrmQueries', () => ({
  useAllBotUsersQuery: () => ({ data: [], isLoading: false }),
}));

vi.mock('../../../../hooks/dashboard/useBlogQueries', () => ({
  useBlogArticlesQuery: () => ({ data: [], isLoading: false }),
}));

vi.mock('../../../../store/useAuthStore', () => ({
  useAuthStore: (selector: any) =>
    selector ? selector({ user: { name: 'Owner' } }) : { user: { name: 'Owner' } },
}));

vi.mock('../../../../store/useBotStore', () => ({
  useBotStore: (selector: any) =>
    selector ? selector({ activeBotId: 1, setActiveBotId: vi.fn() }) : { activeBotId: 1, setActiveBotId: vi.fn() },
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

describe('DashboardPage', () => {
  it('renders owner main dashboard page', () => {
    render(<DashboardPage />, { wrapper: Wrapper });

    expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
  });
});
