import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { AdminBroadcastsPage } from '../AdminBroadcastsPage';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../../i18n/config', () => ({
  t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k) }),
  getLanguage: () => 'uk',
}));

vi.mock('../../../../api/admin', () => ({
  fetchAdminBroadcastsApi: vi.fn(() =>
    Promise.resolve({
      content: [],
      totalElements: 0,
      totalPages: 1,
    })
  ),
  fetchAdminBroadcastDetailsApi: vi.fn(() => Promise.resolve({})),
  cancelAdminBroadcastApi: vi.fn(() => Promise.resolve({})),
  blockAdminBroadcastApi: vi.fn(() => Promise.resolve({})),
  unblockAdminBroadcastApi: vi.fn(() => Promise.resolve({})),
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

describe('AdminBroadcastsPage', () => {
  it('renders admin broadcasts monitor page', () => {
    const { container } = render(<AdminBroadcastsPage />, { wrapper: Wrapper });
    expect(container).toBeDefined();
  });
});
