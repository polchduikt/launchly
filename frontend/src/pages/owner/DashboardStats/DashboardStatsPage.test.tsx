import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardStatsPage } from './DashboardStatsPage';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../i18n/config', () => ({
  t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k) }),
  getLanguage: () => 'uk',
}));

vi.mock('../../../hooks/dashboard/useDashboardStatsQuery', () => ({
  useDashboardStatsQuery: () => ({
    data: {
      totalSubscribers: 100,
      activeSubscribers: 80,
      newSubscribersToday: 5,
      totalMessagesSent: 500,
      totalMessagesReceived: 300,
      automationRuns: 40,
    },
    isLoading: false,
  }),
}));

vi.mock('../../../hooks/bot/useBotsQuery', () => ({
  useBotsQuery: () => ({ data: [{ id: 1, name: 'Bot 1', hasTelegramToken: true }], isLoading: false }),
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

describe('DashboardStatsPage', () => {
  it('renders stats dashboard overview', () => {
    render(<DashboardStatsPage />, { wrapper: Wrapper });

    expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
  });

  it('renders stat card tooltips with info descriptions', () => {
    render(<DashboardStatsPage />, { wrapper: Wrapper });

    expect(screen.getByLabelText('dashboard.stats.tooltip.total_subscribers')).toBeInTheDocument();
    expect(screen.getByLabelText('dashboard.stats.tooltip.active_users')).toBeInTheDocument();
    expect(screen.getByLabelText('dashboard.stats.tooltip.total_clicks')).toBeInTheDocument();
    expect(screen.getByLabelText('dashboard.stats.tooltip.active_automations')).toBeInTheDocument();
    expect(screen.getByLabelText('dashboard.stats.tooltip.interaction_history')).toBeInTheDocument();
    expect(screen.getByLabelText('dashboard.stats.tooltip.top_clicked_buttons')).toBeInTheDocument();
    expect(screen.getByLabelText('dashboard.stats.tooltip.ai_insights')).toBeInTheDocument();
    expect(screen.getByLabelText('dashboard.stats.tooltip.tags_breakdown')).toBeInTheDocument();
    expect(screen.getByLabelText('dashboard.stats.tooltip.activity_heatmap')).toBeInTheDocument();
  });
});
