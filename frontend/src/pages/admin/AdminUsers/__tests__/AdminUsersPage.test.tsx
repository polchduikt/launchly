import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { AdminUsersPage } from '../AdminUsersPage';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../../i18n/config', () => ({
  t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k) }),
  getLanguage: () => 'uk',
}));

vi.mock('../../../../api/admin', () => ({
  fetchAdminUsersApi: vi.fn(() =>
    Promise.resolve({
      content: [
        {
          id: 1,
          name: 'John Admin',
          email: 'admin@launchly.app',
          role: 'ROLE_ADMIN',
          active: true,
          plan: 'PRO',
          createdAt: '2026-08-01',
        },
      ],
      totalElements: 1,
      totalPages: 1,
    })
  ),
  updateUserRoleApi: vi.fn(() => Promise.resolve({})),
  toggleUserStatusApi: vi.fn(() => Promise.resolve({})),
  fetchAdminUserDetailsApi: vi.fn(() => Promise.resolve({})),
}));

vi.mock('../../../../store/useAuthStore', () => ({
  useAuthStore: (selector?: (state: Record<string, unknown>) => unknown) =>
    selector
      ? selector({ user: { role: 'ROLE_ADMIN', email: 'admin@launchly.app' } })
      : { user: { role: 'ROLE_ADMIN', email: 'admin@launchly.app' } },
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

describe('AdminUsersPage', () => {
  it('renders admin users management page', () => {
    const { container } = render(<AdminUsersPage />, { wrapper: Wrapper });
    expect(container).toBeDefined();
  });
});
