import React from 'react';
import { ExternalLink, Edit2, Trash2, User as UserIcon, Clock, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from '../../../../i18n/config';
import type { BlogArticle } from '../../../../const/blogData';

interface BlogArticleCardProps {
  article: BlogArticle;
  onEdit: (article: BlogArticle) => void;
  onDelete: (article: BlogArticle) => void;
}

export const BlogArticleCard: React.FC<BlogArticleCardProps> = ({ article, onEdit, onDelete }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white border-2 border-[#0A0A0A] rounded-3xl shadow-[6px_6px_0px_#0A0A0A] overflow-hidden flex flex-col group hover:-translate-y-1 transition-all">
      <div className="aspect-[16/9] w-full border-b-2 border-[#0A0A0A] relative bg-slate-100 overflow-hidden shrink-0">
        {article.coverImage ? (
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-orange-100 text-slate-400">
            <ImageIcon size={36} />
          </div>
        )}
        <div className="absolute top-3 left-3 px-2.5 py-1 bg-[#0A0A0A] text-[#F2EBDD] border border-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_#0A0A0A]">
          {article.category}
        </div>

        <div
          className={`absolute top-3 right-3 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border border-white tracking-wider shadow-[2px_2px_0px_#0A0A0A] ${
            (article.language || 'uk').toLowerCase() === 'en' ? 'bg-amber-400 text-[#0A0A0A]' : 'bg-blue-600 text-white'
          }`}
        >
          {(article.language || 'uk').toUpperCase()}
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <h3 className="font-['Anybody',sans-serif] text-base font-black text-[#0A0A0A] uppercase line-clamp-2 leading-snug break-words [overflow-wrap:anywhere]">
            {article.title}
          </h3>
          <p className="text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed font-['Geist',sans-serif] break-words [overflow-wrap:anywhere]">
            {article.summary || '—'}
          </p>
        </div>

        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {article.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded-md text-[9px] font-bold text-slate-700"
              >
                #{tag}
              </span>
            ))}
            {article.tags.length > 3 && (
              <span className="text-[9px] font-bold text-slate-400 self-center">
                +{article.tags.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="pt-3 border-t-2 border-slate-100 space-y-3">
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
            <div className="flex items-center gap-1.5 truncate">
              <UserIcon size={12} />
              <span className="truncate">{article.author}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {article.readTime}
              </span>
              <span>•</span>
              <span>{article.date}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <a
              href={`/blog/${encodeURIComponent(article.id)}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-1.5 bg-slate-50 border-2 border-[#0A0A0A] rounded-xl text-[11px] font-black uppercase text-center flex items-center justify-center gap-1 text-[#0A0A0A] hover:bg-slate-100 transition shadow-[2px_2px_0px_#0A0A0A]"
            >
              <ExternalLink size={12} />
              <span>{t('admin.blog.btn_preview', 'Перегляд')}</span>
            </a>
            <button
              onClick={() => onEdit(article)}
              className="flex-1 py-1.5 bg-amber-200 border-2 border-[#0A0A0A] rounded-xl text-[11px] font-black uppercase text-center flex items-center justify-center gap-1 text-amber-950 hover:bg-amber-300 transition shadow-[2px_2px_0px_#0A0A0A] cursor-pointer"
            >
              <Edit2 size={12} />
              <span>{t('admin.blog.btn_edit', 'Редагувати')}</span>
            </button>
            <button
              onClick={() => onDelete(article)}
              className="w-8 h-8 bg-rose-100 border-2 border-[#0A0A0A] rounded-xl text-rose-800 hover:bg-rose-200 flex items-center justify-center transition shadow-[2px_2px_0px_#0A0A0A] cursor-pointer shrink-0"
              title={t('admin.blog.delete_tooltip', 'Видалити статтю')}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
