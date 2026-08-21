import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  useAdminBlogArticlesQuery,
  useAdminBlogArticleDetailQuery,
  useCreateBlogArticleMutation,
  useUpdateBlogArticleMutation,
  useDeleteBlogArticleMutation,
} from './useAdminBlogQueries';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('../../api/adminBlog', () => ({
  getAdminBlogArticlesApi: vi.fn().mockResolvedValue([{ id: '1', title: 'Test Article' }]),
  getAdminBlogArticleDetailApi: vi.fn().mockResolvedValue({ id: '1', title: 'Test Article Detail' }),
  createBlogArticleApi: vi.fn().mockResolvedValue({ id: '2', title: 'Created Article' }),
  updateBlogArticleApi: vi.fn().mockResolvedValue({ id: '1', title: 'Updated Article' }),
  deleteBlogArticleApi: vi.fn().mockResolvedValue({ success: true }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useAdminBlogQueries', () => {
  it('fetches admin blog articles', async () => {
    const { result } = renderHook(() => useAdminBlogArticlesQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: '1', title: 'Test Article' }]);
  });

  it('fetches admin blog article detail when id is provided', async () => {
    const { result } = renderHook(() => useAdminBlogArticleDetailQuery('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.title).toBe('Test Article Detail');
  });

  it('executes create, update and delete mutations', async () => {
    const wrapper = createWrapper();
    const { result: createRes } = renderHook(() => useCreateBlogArticleMutation(), { wrapper });
    const { result: updateRes } = renderHook(() => useUpdateBlogArticleMutation('1'), { wrapper });
    const { result: deleteRes } = renderHook(() => useDeleteBlogArticleMutation(), { wrapper });

    const created = await createRes.current.mutateAsync({ title: 'New' } as unknown as never);
    const updated = await updateRes.current.mutateAsync({ title: 'Updated' } as unknown as never);
    const deleted = await deleteRes.current.mutateAsync('1');

    expect(created).toEqual({ id: '2', title: 'Created Article' });
    expect(updated).toEqual({ id: '1', title: 'Updated Article' });
    expect(deleted).toEqual({ success: true });
  });
});
