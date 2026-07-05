import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../lib/axios';
import type { BlogArticle } from '../config/blogData';

export const useBlogArticlesQuery = () => {
  return useQuery<BlogArticle[]>({
    queryKey: ['blogArticles'],
    queryFn: async () => {
      const response = await apiClient.get<BlogArticle[]>('/blog');
      return response.data;
    }
  });
};

export const useBlogArticleDetailQuery = (id: string | undefined) => {
  return useQuery<BlogArticle>({
    queryKey: ['blogArticle', id],
    queryFn: async () => {
      if (!id) throw new Error('Article ID is required');
      const response = await apiClient.get<BlogArticle>(`/blog/${id}`);
      return response.data;
    },
    enabled: !!id
  });
};
