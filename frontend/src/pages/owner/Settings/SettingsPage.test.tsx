import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SettingsPage } from './SettingsPage';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../i18n/config', () => ({
  t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k) }),
  getLanguage: () => 'uk',
}));

vi.mock('../../../hooks/auth/useLogoutMutation', () => ({
  useLogoutMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../../../hooks/bot/useBotsQuery', () => ({
  useBotsQuery: () => ({ data: [{ id: 1, name: 'Bot 1' }], isLoading: false }),
}));

vi.mock('../../../hooks/bot/useBotMutations', () => ({
  useStartBotMutation: () => ({ mutateAsync: vi.fn() }),
  useStopBotMutation: () => ({ mutateAsync: vi.fn() }),
  useDeleteBotMutation: () => ({ mutateAsync: vi.fn() }),
  useUpdateBotMutation: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('../../../store/useAuthStore', () => ({
  useAuthStore: (selector?: (state: Record<string, unknown>) => unknown) =>
    selector ? selector({ user: { email: 'owner@launchly.app', timezone: 'UTC' }, setUser: vi.fn() }) : { user: { email: 'owner@launchly.app' } },
}));

vi.mock('../../../store/useBotStore', () => ({
  useBotStore: (selector?: (state: Record<string, unknown>) => unknown) =>
    selector ? selector({ activeBotId: 1 }) : { activeBotId: 1 },
}));

vi.mock('../../../components/layout/DashboardLayout', () => ({
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

describe('SettingsPage', () => {
  it('renders settings dashboard layout', () => {
    render(<SettingsPage />, { wrapper: Wrapper });

    expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
  });
});
