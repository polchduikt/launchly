import React from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from '../../../../i18n/config';

interface BlogFiltersBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (c: string) => void;
  selectedLangFilter: string;
  onLangFilterChange: (l: string) => void;
  categories: string[];
  totalArticles: number;
}

export const BlogFiltersBar: React.FC<BlogFiltersBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedLangFilter,
  onLangFilterChange,
  categories,
  totalArticles,
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white p-4 rounded-2xl border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder={t('admin.blog.search_placeholder', 'Пошук статей за назвою, категорією або тегами...')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] focus:outline-none placeholder:text-slate-400"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center bg-slate-100 border-2 border-[#0A0A0A] rounded-xl p-0.5 shadow-[2px_2px_0px_#0A0A0A]">
          <button
            type="button"
            onClick={() => onLangFilterChange('all')}
            className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
              selectedLangFilter === 'all'
                ? 'bg-[#0A0A0A] text-[#F2EBDD]'
                : 'text-slate-600 hover:text-[#0A0A0A]'
            }`}
          >
            {t('admin.blog.filter_lang_all', 'Всі мови')}
          </button>
          <button
            type="button"
            onClick={() => onLangFilterChange('uk')}
            className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
              selectedLangFilter === 'uk'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:text-[#0A0A0A]'
            }`}
          >
            UK
          </button>
          <button
            type="button"
            onClick={() => onLangFilterChange('en')}
            className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
              selectedLangFilter === 'en'
                ? 'bg-amber-400 text-[#0A0A0A]'
                : 'text-slate-600 hover:text-[#0A0A0A]'
            }`}
          >
            EN
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          <button
            onClick={() => onCategoryChange('all')}
            className={`px-3 py-1.5 text-xs font-black uppercase rounded-xl border-2 transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#0A0A0A] text-[#F2EBDD] border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]'
                : 'bg-white text-[#0A0A0A] border-[#0A0A0A] hover:bg-slate-100'
            }`}
          >
            {t('admin.blog.filter_all', 'Всі')} ({totalArticles})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-3 py-1.5 text-xs font-black uppercase rounded-xl border-2 transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#0A0A0A] text-[#F2EBDD] border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]'
                  : 'bg-white text-[#0A0A0A] border-[#0A0A0A] hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
