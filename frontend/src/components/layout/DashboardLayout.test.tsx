import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardLayout } from './DashboardLayout';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: (selector?: (state: Record<string, unknown>) => unknown) =>
    selector
      ? selector({
          user: { id: 1, email: 'owner@launchly.app', role: 'ROLE_USER' },
          logout: vi.fn(),
        })
      : {
          user: { id: 1, email: 'owner@launchly.app', role: 'ROLE_USER' },
          logout: vi.fn(),
        },
}));

vi.mock('../../store/useThemeStore', () => ({
  useThemeStore: () => ({
    theme: 'light',
    setTheme: vi.fn(),
  }),
}));

vi.mock('../../hooks/crm/useCrmQueries', () => ({
  useAllBotUsersQuery: () => ({ data: [], isLoading: false }),
}));

vi.mock('../../hooks/bot/useBillingQueries', () => ({
  usePlansQuery: () => ({ data: [], isLoading: false }),
  useSubscriptionQuery: () => ({ data: { status: 'ACTIVE' }, isLoading: false }),
  useCheckoutMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useCancelSubscriptionMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useResumeSubscriptionMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useConfirmSessionMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../../hooks/support/useSupportQueries', () => ({
  useUserTicketsQuery: () => ({ data: { content: [] }, isLoading: false }),
}));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe('DashboardLayout', () => {
  it('renders dashboard sidebar, top bar, and content', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <DashboardLayout>
            <div>Dashboard Child View</div>
          </DashboardLayout>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Dashboard Child View')).toBeInTheDocument();
  });
});
