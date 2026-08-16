import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminBlogArticlesApi,
  getAdminBlogArticleDetailApi,
  createBlogArticleApi,
  updateBlogArticleApi,
  deleteBlogArticleApi,
  type SaveBlogArticlePayload,
} from '../../api/adminBlog';
import type { BlogArticle } from '../../const/blogData';

export const useAdminBlogArticlesQuery = () => {
  return useQuery<BlogArticle[]>({
    queryKey: ['adminBlogArticles'],
    queryFn: getAdminBlogArticlesApi,
  });
};

export const useAdminBlogArticleDetailQuery = (id: string | null | undefined) => {
  return useQuery<BlogArticle>({
    queryKey: ['adminBlogArticle', id],
    queryFn: () => getAdminBlogArticleDetailApi(id!),
    enabled: !!id,
  });
};

export const useCreateBlogArticleMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveBlogArticlePayload) => createBlogArticleApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBlogArticles'] });
      queryClient.invalidateQueries({ queryKey: ['blogArticles'] });
    },
  });
};

export const useUpdateBlogArticleMutation = (id: string | null | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveBlogArticlePayload) => updateBlogArticleApi(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBlogArticles'] });
      queryClient.invalidateQueries({ queryKey: ['adminBlogArticle', id] });
      queryClient.invalidateQueries({ queryKey: ['blogArticles'] });
      queryClient.invalidateQueries({ queryKey: ['blogArticle', id] });
    },
  });
};

export const useDeleteBlogArticleMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBlogArticleApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBlogArticles'] });
      queryClient.invalidateQueries({ queryKey: ['blogArticles'] });
    },
  });
};
