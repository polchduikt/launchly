import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from '../../i18n/config';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  isDanger = true,
  onConfirm,
  onClose,
}) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-16 px-4 font-['JetBrains_Mono',monospace] bg-slate-500/30 dark:bg-black/60 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#18181B] rounded-3xl shadow-2xl border border-slate-200/80 dark:border-[#27272A] w-full max-w-md p-6 overflow-hidden animate-fade-in-down cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121214] flex items-center justify-center shrink-0">
            <AlertTriangle size={22} className="text-[#0A0A0A] dark:text-rose-400" strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="font-['Anybody',sans-serif] text-base font-black text-[#0A0A0A] dark:text-[#E4E4E7] uppercase tracking-wide leading-snug">
              {title}
            </h3>
            <p className="text-xs text-slate-600 dark:text-[#A1A1AA] font-bold mt-1.5 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="h-px bg-slate-200 dark:bg-[#27272A] my-5" />

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold text-[#0A0A0A] dark:text-[#E4E4E7] bg-white dark:bg-[#18181B] hover:bg-slate-50 dark:hover:bg-[#27272A] border border-slate-200 dark:border-[#27272A] rounded-2xl transition-all cursor-pointer shadow-sm"
          >
            {cancelText || t('common.cancel', 'Скасувати')}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-6 py-2.5 text-xs font-black uppercase rounded-2xl transition-all cursor-pointer shadow-sm ${
              isDanger
                ? 'bg-[#FCE7E7] hover:bg-rose-200 border border-rose-200 text-[#0A0A0A]'
                : 'bg-[#0A0A0A] hover:bg-zinc-800 border border-[#0A0A0A] text-[#F2EBDD]'
            }`}
          >
            {confirmText || t('common.confirm', 'Підтвердити')}
          </button>
        </div>
      </div>
    </div>
  );
};
