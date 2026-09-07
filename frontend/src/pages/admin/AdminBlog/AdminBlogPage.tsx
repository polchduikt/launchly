import React, { useState, useMemo } from 'react';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import {
  useAdminBlogArticlesQuery,
  useDeleteBlogArticleMutation,
} from '../../../hooks/admin/useAdminBlogQueries';
import { useAuthStore } from '../../../store/useAuthStore';
import type { BlogArticle } from '../../../const/blogData';
import { BlogStatsOverview } from './components/BlogStatsOverview';
import { BlogFiltersBar } from './components/BlogFiltersBar';
import { BlogArticlesGrid } from './components/BlogArticlesGrid';
import { DeleteBlogArticleModal } from './components/DeleteBlogArticleModal';
import { BlogEditorView } from './components/BlogEditorView';

export const AdminBlogPage: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user);

  const { data: articles = [], isLoading } = useAdminBlogArticlesQuery();
  const deleteMutation = useDeleteBlogArticleMutation();

  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
  const [selectedArticle, setSelectedArticle] = useState<BlogArticle | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLangFilter, setSelectedLangFilter] = useState<string>('all');

  const [articleToDelete, setArticleToDelete] = useState<BlogArticle | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    articles.forEach((a) => {
      if (a.category) set.add(a.category);
    });
    return Array.from(set);
  }, [articles]);

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      if (selectedLangFilter !== 'all' && (article.language || 'uk').toLowerCase() !== selectedLangFilter.toLowerCase()) {
        return false;
      }
      if (selectedCategory !== 'all' && article.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = article.title?.toLowerCase().includes(q);
        const matchSummary = article.summary?.toLowerCase().includes(q);
        const matchCategory = article.category?.toLowerCase().includes(q);
        const matchTags = article.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchSummary && !matchCategory && !matchTags) {
          return false;
        }
      }
      return true;
    });
  }, [articles, selectedCategory, selectedLangFilter, searchQuery]);

  const handleOpenCreateView = () => {
    setSelectedArticle(null);
    setViewMode('editor');
  };

  const handleOpenEditView = (article: BlogArticle) => {
    setSelectedArticle(article);
    setViewMode('editor');
  };

  const handleDeleteConfirm = () => {
    if (!articleToDelete) return;
    deleteMutation.mutate(articleToDelete.id, {
      onSuccess: () => {
        setArticleToDelete(null);
      },
    });
  };

  if (viewMode === 'editor') {
    return (
      <AdminLayout>
        <BlogEditorView
          initialArticle={selectedArticle}
          currentUser={currentUser}
          onBack={() => setViewMode('list')}
          onSuccess={() => setViewMode('list')}
        />
      </AdminLayout>
    );
  }

  const hasFilters = Boolean(searchQuery || selectedCategory !== 'all' || selectedLangFilter !== 'all');

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12 font-['JetBrains_Mono',monospace]">
        <BlogStatsOverview
          totalArticles={articles.length}
          categoriesCount={categories.length}
          latestArticleTitle={articles[0]?.title}
          onCreateClick={handleOpenCreateView}
        />

        <BlogFiltersBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedLangFilter={selectedLangFilter}
          onLangFilterChange={setSelectedLangFilter}
          categories={categories}
          totalArticles={articles.length}
        />

        <BlogArticlesGrid
          articles={filteredArticles}
          isLoading={isLoading}
          hasFilters={hasFilters}
          onCreateClick={handleOpenCreateView}
          onEdit={handleOpenEditView}
          onDelete={setArticleToDelete}
        />
      </div>

      <DeleteBlogArticleModal
        article={articleToDelete}
        isDeleting={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onClose={() => setArticleToDelete(null)}
      />
    </AdminLayout>
  );
};

export default AdminBlogPage;
