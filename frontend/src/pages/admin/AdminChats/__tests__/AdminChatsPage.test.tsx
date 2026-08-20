import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { AdminChatsPage } from '../AdminChatsPage';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../../i18n/config', () => ({
  t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k) }),
  getLanguage: () => 'uk',
}));

vi.mock('../../../../api/admin', () => ({
  fetchAdminSupportTicketsApi: vi.fn(() =>
    Promise.resolve({
      content: [],
      totalElements: 0,
      totalPages: 1,
    })
  ),
  fetchAdminSupportTicketDetailApi: vi.fn(() => Promise.resolve({})),
  sendAdminSupportMessageApi: vi.fn(() => Promise.resolve({})),
  toggleAdminSupportTicketFavoriteApi: vi.fn(() => Promise.resolve({})),
  toggleAdminSupportTicketStatusApi: vi.fn(() => Promise.resolve({})),
  claimAdminSupportTicketApi: vi.fn(() => Promise.resolve({})),
  fetchAdminUserDetailsApi: vi.fn(() => Promise.resolve({})),
}));

vi.mock('../../../../store/useAuthStore', () => ({
  useAuthStore: () => ({
    user: { role: 'ROLE_MANAGER', email: 'manager@launchly.app' },
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

describe('AdminChatsPage', () => {
  it('renders admin support tickets page', () => {
    const { container } = render(<AdminChatsPage />, { wrapper: Wrapper });
    expect(container).toBeDefined();
  });
});
