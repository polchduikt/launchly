import React from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { useTranslation } from '../../../../i18n/config';
import type { BlogArticle } from '../../../../const/blogData';

interface DeleteBlogArticleModalProps {
  article: BlogArticle | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeleteBlogArticleModal: React.FC<DeleteBlogArticleModalProps> = ({
  article,
  isDeleting,
  onConfirm,
  onClose,
}) => {
  const { t } = useTranslation();

  if (!article) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0A0A]/50 animate-fade-in font-['JetBrains_Mono',monospace] cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#F2EBDD] rounded-3xl border-2 border-[#0A0A0A] shadow-[8px_8px_0px_#0A0A0A] w-full max-w-md p-6 space-y-4 animate-zoom-in cursor-default"
      >
        <div className="w-12 h-12 rounded-2xl bg-rose-100 border-2 border-[#0A0A0A] text-rose-700 flex items-center justify-center mx-auto shadow-[3px_3px_0px_#0A0A0A]">
          <Trash2 size={24} />
        </div>

        <div className="text-center space-y-1.5">
          <h3 className="font-['Anybody',sans-serif] text-base font-black text-[#0A0A0A] uppercase">
            {t('admin.blog.delete_modal_title', 'Видалити публікацію?')}
          </h3>
          <p className="text-xs text-slate-600 font-bold leading-relaxed">
            {t('admin.blog.delete_modal_desc', { title: article.title })}
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase text-[#0A0A0A] hover:bg-slate-100 transition cursor-pointer"
          >
            {t('admin.blog.btn_cancel', 'Скасувати')}
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-rose-600 text-white border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 hover:bg-rose-700 transition cursor-pointer shadow-[3px_3px_0px_#0A0A0A] disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            <span>{t('admin.blog.btn_delete', 'Видалити')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
