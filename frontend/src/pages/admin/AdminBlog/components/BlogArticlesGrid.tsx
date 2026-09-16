import React from 'react';
import { Loader2, BookOpen } from 'lucide-react';
import { useTranslation } from '../../../../i18n/config';
import type { BlogArticle } from '../../../../const/blogData';
import { BlogArticleCard } from './BlogArticleCard';

interface BlogArticlesGridProps {
  articles: BlogArticle[];
  isLoading: boolean;
  hasFilters: boolean;
  onCreateClick: () => void;
  onEdit: (article: BlogArticle) => void;
  onDelete: (article: BlogArticle) => void;
}

export const BlogArticlesGrid: React.FC<BlogArticlesGridProps> = ({
  articles,
  isLoading,
  hasFilters,
  onCreateClick,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3 bg-white border-2 border-[#0A0A0A] rounded-3xl shadow-[6px_6px_0px_#0A0A0A]">
        <Loader2 className="animate-spin text-[#0A0A0A]" size={36} />
        <span className="text-xs font-black uppercase text-slate-600">
          {t('admin.blog.loading', 'Завантаження публікацій...')}
        </span>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="p-16 text-center space-y-4 bg-white border-2 border-[#0A0A0A] rounded-3xl shadow-[6px_6px_0px_#0A0A0A]">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 border-2 border-[#0A0A0A] flex items-center justify-center mx-auto shadow-[3px_3px_0px_#0A0A0A]">
          <BookOpen size={28} className="text-[#0A0A0A]" />
        </div>
        <h3 className="font-['Anybody',sans-serif] text-lg font-black text-[#0A0A0A] uppercase">
          {t('admin.blog.empty_title', 'Статей не знайдено')}
        </h3>
        <p className="text-xs text-slate-500 font-bold max-w-md mx-auto leading-relaxed">
          {hasFilters
            ? t('admin.blog.empty_search_desc', 'Спробуйте змінити пошуковий запит або обрати іншу категорію.')
            : t('admin.blog.empty_no_posts_desc', 'У блозі ще немає опублікованих статей. Створіть вашу першу публікацію прямо зараз!')}
        </p>
        <button
          onClick={onCreateClick}
          className="px-5 py-2.5 bg-[#0A0A0A] text-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase shadow-[3px_3px_0px_#0A0A0A] cursor-pointer"
        >
          {t('admin.blog.btn_create_short', '+ Створити статтю')}
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article) => (
        <BlogArticleCard
          key={article.id}
          article={article}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
