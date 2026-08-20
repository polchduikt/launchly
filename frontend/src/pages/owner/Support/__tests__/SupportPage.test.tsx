import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SupportPage } from '../SupportPage';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../../i18n/config', () => ({
  t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k) }),
  getLanguage: () => 'uk',
}));

vi.mock('../../../../hooks/support/useSupportQueries', () => ({
  useUserTicketsQuery: () => ({ data: { content: [] }, isLoading: false }),
  useUserTicketDetailQuery: () => ({ data: null, isLoading: false }),
  useCreateTicketMutation: () => ({ mutate: vi.fn() }),
  useSendTicketMessageMutation: () => ({ mutate: vi.fn() }),
  useUpdateTicketStatusMutation: () => ({ mutate: vi.fn() }),
}));

vi.mock('../../../../store/useAuthStore', () => ({
  useAuthStore: (selector?: (state: Record<string, unknown>) => unknown) =>
    selector ? selector({ user: { email: 'owner@launchly.app' } }) : { user: { email: 'owner@launchly.app' } },
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

describe('SupportPage', () => {
  it('renders support center layout', () => {
    render(<SupportPage />, { wrapper: Wrapper });

    expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
  });
});
