import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { AdminLogsPage } from './AdminLogsPage';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../i18n/config', () => ({
  t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k) }),
  getLanguage: () => 'uk',
}));

vi.mock('../../../api/admin', () => ({
  fetchAdminLogsApi: vi.fn(() =>
    Promise.resolve({
      content: [],
      totalElements: 0,
      totalPages: 1,
    })
  ),
}));

vi.mock('../../../store/useAuthStore', () => ({
  useAuthStore: () => ({
    user: { role: 'ROLE_ADMIN', email: 'admin@launchly.app' },
  }),
}));

vi.mock('../../../components/layout/AdminLayout', () => ({
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

describe('AdminLogsPage', () => {
  it('renders admin system logs page', () => {
    const { container } = render(<AdminLogsPage />, { wrapper: Wrapper });
    expect(container).toBeDefined();
  });
});
