import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { AdminStatsPage } from '../AdminStatsPage';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../../i18n/config', () => ({
  t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k) }),
  getLanguage: () => 'uk',
}));

vi.mock('../../../../api/admin', () => ({
  fetchAdminStatsApi: vi.fn(() =>
    Promise.resolve({
      totalUsers: 100,
      activeUsers: 80,
      totalBots: 50,
      totalAutomations: 120,
      totalMessages: 5000,
      revenueStats: { mrr: 1500, arr: 18000 },
      chartData: [],
    })
  ),
}));

vi.mock('../../../../store/useAuthStore', () => ({
  useAuthStore: () => ({
    user: { role: 'ROLE_ADMIN', email: 'admin@launchly.app' },
  }),
}));

vi.mock('../../../../components/layout/AdminLayout', () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="admin-layout">{children}</div>
  ),
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('AdminStatsPage', () => {
  it('renders admin statistics overview page', () => {
    const { container } = render(<AdminStatsPage />, { wrapper: Wrapper });
    expect(container).toBeDefined();
  });
});
