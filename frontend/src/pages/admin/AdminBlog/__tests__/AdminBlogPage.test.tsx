import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { AdminBlogPage } from '../AdminBlogPage';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../../i18n/config', () => ({
  t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k) }),
  getLanguage: () => 'uk',
}));

vi.mock('../../../../hooks/admin/useAdminBlogQueries', () => ({
  useAdminBlogArticlesQuery: () => ({ data: [], isLoading: false }),
  useCreateBlogArticleMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateBlogArticleMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteBlogArticleMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('../../../../hooks/bot/useMediaUpload', () => ({
  useMediaUpload: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('../../../../store/useAuthStore', () => ({
  useAuthStore: (selector: any) =>
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

describe('AdminBlogPage', () => {
  it('renders admin blog management page', () => {
    const { container } = render(<AdminBlogPage />, { wrapper: Wrapper });
    expect(container).toBeDefined();
  });
});
