import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '../../i18n/config';

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  totalElements?: number;
  currentCount?: number;
  onPageChange: (newPage: number) => void;
}

export const AdminPagination: React.FC<AdminPaginationProps> = React.memo(({
  page,
  totalPages,
  totalElements,
  currentCount,
  onPageChange,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-[#0A0A0A] pt-2">
      <div className="text-[#0A0A0A]/70">
        {t('admin.showing') !== 'admin.showing' ? t('admin.showing') : 'Показано'}{' '}
        <span className="font-black text-[#0A0A0A]">{currentCount ?? 0}</span>{' '}
        {t('admin.of') !== 'admin.of' ? t('admin.of') : 'з'}{' '}
        <span className="font-black text-[#0A0A0A]">{totalElements ?? 0}</span>
      </div>
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(page - 1, 0))}
          disabled={page === 0}
          className="flex items-center space-x-1 px-3 py-1 rounded-xl border-2 border-[#0A0A0A] bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] text-[#0A0A0A] font-black disabled:opacity-40 disabled:cursor-not-allowed transition shadow-[2px_2px_0px_#0A0A0A] cursor-pointer"
        >
          <ChevronLeft size={14} />
          <span>{t('admin.prev') !== 'admin.prev' ? t('admin.prev') : 'Назад'}</span>
        </button>

        <div className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-white border-2 border-[#0A0A0A] text-xs font-black font-mono text-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]">
          <span>{page + 1}</span>
          <span>/</span>
          <span>{Math.max(totalPages, 1)}</span>
        </div>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(page + 1, Math.max(totalPages, 1) - 1))}
          disabled={page >= totalPages - 1}
          className="flex items-center space-x-1 px-3 py-1 rounded-xl border-2 border-[#0A0A0A] bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] text-[#0A0A0A] font-black disabled:opacity-40 disabled:cursor-not-allowed transition shadow-[2px_2px_0px_#0A0A0A] cursor-pointer"
        >
          <span>{t('admin.next') !== 'admin.next' ? t('admin.next') : 'Далі'}</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
});
