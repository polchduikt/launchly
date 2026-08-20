import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBlogArticlesQuery, useBlogArticleDetailQuery } from '../useBlogQueries';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('../../../api/axios', () => ({
  default: {
    get: vi.fn().mockImplementation((url: string) => {
      if (url === '/blog') {
        return Promise.resolve({ data: [{ id: 'article-1', title: 'Public Blog' }] });
      }
      return Promise.resolve({ data: { id: 'article-1', title: 'Public Blog Detail' } });
    }),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useBlogQueries', () => {
  it('fetches public blog articles and article detail', async () => {
    const wrapper = createWrapper();
    const { result: listRes } = renderHook(() => useBlogArticlesQuery('uk'), { wrapper });
    const { result: detailRes } = renderHook(() => useBlogArticleDetailQuery('article-1'), { wrapper });

    await waitFor(() => expect(listRes.current.isSuccess).toBe(true));
    await waitFor(() => expect(detailRes.current.isSuccess).toBe(true));

    expect(listRes.current.data).toEqual([{ id: 'article-1', title: 'Public Blog' }]);
    expect(detailRes.current.data?.title).toBe('Public Blog Detail');
  });
});
