import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { AdminAutomationsPage } from '../AdminAutomationsPage';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../../i18n/config', () => ({
  t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k) }),
  getLanguage: () => 'uk',
}));

vi.mock('../../../../api/admin', () => ({
  fetchAdminAutomationsApi: vi.fn(() =>
    Promise.resolve({
      content: [],
      totalElements: 0,
      totalPages: 1,
    })
  ),
  fetchAdminAutomationDetailsApi: vi.fn(() => Promise.resolve({})),
  toggleAutomationApi: vi.fn(() => Promise.resolve({})),
  blockAutomationApi: vi.fn(() => Promise.resolve({})),
  unblockAutomationApi: vi.fn(() => Promise.resolve({})),
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

describe('AdminAutomationsPage', () => {
  it('renders admin automations monitor page', () => {
    const { container } = render(<AdminAutomationsPage />, { wrapper: Wrapper });
    expect(container).toBeDefined();
  });
});
