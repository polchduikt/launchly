import React from 'react';
import { BookOpen, Plus, FileText, Layers, Calendar } from 'lucide-react';
import { useTranslation } from '../../../../i18n/config';

interface BlogStatsOverviewProps {
  totalArticles: number;
  categoriesCount: number;
  latestArticleTitle: string | undefined;
  onCreateClick: () => void;
}

export const BlogStatsOverview: React.FC<BlogStatsOverviewProps> = ({
  totalArticles,
  categoriesCount,
  latestArticleTitle,
  onCreateClick,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A]">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-200 border-2 border-[#0A0A0A] rounded-xl text-[10px] font-black uppercase shadow-[2px_2px_0px_#0A0A0A]">
            <BookOpen size={13} />
            <span>{t('admin.blog.badge', 'LAUNCHLY BLOG ENGINE')}</span>
          </div>
          <h1 className="font-['Anybody',sans-serif] text-xl sm:text-2xl font-black text-[#0A0A0A] uppercase tracking-tight">
            {t('admin.blog.title', 'Керування статтями блогу')}
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            {t('admin.blog.subtitle', 'Створюйте та редагуйте публікації, гайди та новини платформи')}
          </p>
        </div>

        <button
          onClick={onCreateClick}
          className="px-5 py-3 bg-[#0A0A0A] text-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 hover:bg-[#2A2A2A] transition-all cursor-pointer shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
        >
          <Plus size={16} />
          <span>{t('admin.blog.btn_create', 'Створити публікацію')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border-2 border-[#0A0A0A] rounded-2xl shadow-[4px_4px_0px_#0A0A0A] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 border-2 border-[#0A0A0A] flex items-center justify-center text-blue-900 font-black">
            <FileText size={18} />
          </div>
          <div>
            <div className="text-[10px] uppercase font-black text-slate-500">
              {t('admin.blog.total_articles', 'Всього статей')}
            </div>
            <div className="font-['Anybody',sans-serif] text-xl font-black text-[#0A0A0A]">{totalArticles}</div>
          </div>
        </div>

        <div className="p-4 bg-white border-2 border-[#0A0A0A] rounded-2xl shadow-[4px_4px_0px_#0A0A0A] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 border-2 border-[#0A0A0A] flex items-center justify-center text-emerald-900 font-black">
            <Layers size={18} />
          </div>
          <div>
            <div className="text-[10px] uppercase font-black text-slate-500">
              {t('admin.blog.categories_count', 'Категорій')}
            </div>
            <div className="font-['Anybody',sans-serif] text-xl font-black text-[#0A0A0A]">{categoriesCount}</div>
          </div>
        </div>

        <div className="p-4 bg-white border-2 border-[#0A0A0A] rounded-2xl shadow-[4px_4px_0px_#0A0A0A] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 border-2 border-[#0A0A0A] flex items-center justify-center text-purple-900 font-black">
            <Calendar size={18} />
          </div>
          <div className="truncate">
            <div className="text-[10px] uppercase font-black text-slate-500">
              {t('admin.blog.latest_article', 'Остання стаття')}
            </div>
            <div className="font-['Anybody',sans-serif] text-xs font-black text-[#0A0A0A] truncate">
              {latestArticleTitle || t('admin.blog.no_articles', 'Немає статей')}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
