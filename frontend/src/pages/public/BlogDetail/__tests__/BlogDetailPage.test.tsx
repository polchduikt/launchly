import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import BlogDetailPage from '../BlogDetailPage';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../../i18n/config', () => ({
  t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k) }),
  getLanguage: () => 'uk',
}));

vi.mock('../../../../hooks/useSEO', () => ({
  useSEO: vi.fn(),
}));

vi.mock('../../../../hooks/dashboard/useBlogQueries', () => ({
  useBlogArticleDetailQuery: () => ({
    data: {
      id: 'article-1',
      title: 'How to build bots',
      summary: 'Summary of article',
      category: 'Tutorial',
      date: '2026-08-01',
      readTime: '5 min',
      author: 'Team',
      tags: ['telegram', 'bot'],
      content: [],
    },
    isLoading: false,
  }),
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe('BlogDetailPage', () => {
  it('renders blog detail page with header and footer', () => {
    const { container } = render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/blog/article-1']}>
          <Routes>
            <Route path="/blog/:id" element={<BlogDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(container.querySelector('header')).toBeInTheDocument();
    expect(container.querySelector('footer')).toBeInTheDocument();
  });
});
