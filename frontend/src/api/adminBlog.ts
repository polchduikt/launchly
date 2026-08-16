import apiClient from './axios';
import type { BlogArticle } from '../const/blogData';

export interface SaveBlogArticlePayload {
  id?: string;
  title: string;
  category: string;
  author?: string;
  readTime?: string;
  date?: string;
  summary?: string;
  coverImage?: string;
  language?: string;
  tags?: string[];
  contentBlocks?: Array<
    | { type: 'paragraph'; text: string; level?: number; author?: string; items?: string[]; url?: string; caption?: string }
    | { type: 'heading'; text: string; level: number; author?: string; items?: string[]; url?: string; caption?: string }
    | { type: 'quote'; text: string; author?: string; level?: number; items?: string[]; url?: string; caption?: string }
    | { type: 'list'; items: string[]; text?: string; level?: number; author?: string; url?: string; caption?: string }
    | { type: 'image'; url: string; caption?: string; text?: string; level?: number; author?: string; items?: string[] }
  >;
}

export const getAdminBlogArticlesApi = async (): Promise<BlogArticle[]> => {
  const response = await apiClient.get<BlogArticle[]>('/admin/blog');
  return response.data;
};

export const getAdminBlogArticleDetailApi = async (id: string): Promise<BlogArticle> => {
  const response = await apiClient.get<BlogArticle>(`/admin/blog/${encodeURIComponent(id)}`);
  return response.data;
};

export const createBlogArticleApi = async (payload: SaveBlogArticlePayload): Promise<BlogArticle> => {
  const response = await apiClient.post<BlogArticle>('/admin/blog', payload);
  return response.data;
};

export const updateBlogArticleApi = async (id: string, payload: SaveBlogArticlePayload): Promise<BlogArticle> => {
  const response = await apiClient.put<BlogArticle>(`/admin/blog/${encodeURIComponent(id)}`, payload);
  return response.data;
};

export const deleteBlogArticleApi = async (id: string): Promise<void> => {
  const cleanId = id ? id.trim() : '';
  if (!cleanId) {
    await apiClient.delete('/admin/blog', { params: { id: '' } });
  } else {
    await apiClient.delete(`/admin/blog/${encodeURIComponent(cleanId)}`);
  }
};
