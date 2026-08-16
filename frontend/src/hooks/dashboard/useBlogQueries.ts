import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/axios';
import type { BlogArticle } from '../../const/blogData';

export const useBlogArticlesQuery = (language?: string) => {
  return useQuery<BlogArticle[]>({
    queryKey: ['blogArticles', language],
    queryFn: async () => {
      const response = await apiClient.get<BlogArticle[]>('/blog', {
        params: language ? { lang: language } : undefined,
      });
      return response.data;
    }
  });
};

export const useBlogArticleDetailQuery = (id: string | undefined) => {
  return useQuery<BlogArticle>({
    queryKey: ['blogArticle', id],
    queryFn: async () => {
      if (!id) throw new Error('Article ID is required');
      const response = await apiClient.get<BlogArticle>(`/blog/${encodeURIComponent(id)}`);
      return response.data;
    },
    enabled: !!id
  });
};
