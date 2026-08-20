import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import BlogPage from '../BlogPage';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../i18n/config', () => ({
  t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k) }),
  getLanguage: () => 'uk',
}));

vi.mock('../../../hooks/useSEO', () => ({
  useSEO: vi.fn(),
}));

vi.mock('../../../hooks/dashboard/useBlogQueries', () => ({
  useBlogArticlesQuery: () => ({
    data: [],
    isLoading: false,
  }),
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe('BlogPage', () => {
  it('renders blog page with header and footer', () => {
    const { container } = render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <BlogPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(container.querySelector('header')).toBeInTheDocument();
    expect(container.querySelector('footer')).toBeInTheDocument();
  });
});
