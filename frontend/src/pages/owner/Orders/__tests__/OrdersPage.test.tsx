import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrdersPage } from '../OrdersPage';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../../i18n/config', () => ({
  t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k) }),
  getLanguage: () => 'uk',
}));

vi.mock('../../../../hooks/crm/useCrmQueries', () => ({
  useOrdersQuery: () => ({ data: [], isLoading: false }),
  useUpdateOrderMutation: () => ({ mutate: vi.fn() }),
}));

vi.mock('../../../../store/useBotStore', () => ({
  useBotStore: (selector?: (state: Record<string, unknown>) => unknown) =>
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

describe('OrdersPage', () => {
  it('renders orders management page', () => {
    render(<OrdersPage />, { wrapper: Wrapper });

    expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
  });
});
