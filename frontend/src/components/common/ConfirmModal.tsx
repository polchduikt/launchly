import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from '../../i18n/config';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  confirmLabel?: string;
  cancelText?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  variant?: 'danger' | 'warning' | 'default';
  onConfirm: () => void;
  onClose?: () => void;
  onCancel?: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  confirmLabel,
  cancelText,
  cancelLabel,
  isDanger,
  variant,
  onConfirm,
  onClose,
  onCancel,
}) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const handleClose = onCancel || onClose || (() => {});
  const effectiveVariant = variant || (isDanger === false ? 'default' : 'danger');

  const confirmBtnClass =
    effectiveVariant === 'danger'
      ? 'border border-rose-600 bg-rose-100 hover:bg-rose-600 hover:text-white text-rose-800'
      : effectiveVariant === 'warning'
      ? 'border border-amber-200 bg-amber-100 hover:bg-amber-200 text-[#0A0A0A]'
      : 'border border-[#0A0A0A] bg-[#0A0A0A] hover:bg-white hover:text-[#0A0A0A] text-white';

  const handleConfirm = () => {
    onConfirm();
    if (onClose) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-16 px-4 bg-slate-500/30 dark:bg-black/60 backdrop-blur-[1px]"
      onClick={handleClose}
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

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
          <button
            onClick={handleClose}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-[#0A0A0A] dark:text-[#E4E4E7] bg-white dark:bg-[#18181B] hover:bg-[#0A0A0A] hover:text-white dark:hover:bg-white dark:hover:text-[#0A0A0A] border border-slate-200 dark:border-[#27272A] rounded-2xl transition-all cursor-pointer shadow-sm text-center"
          >
            {cancelLabel || cancelText || t('common.cancel', 'Скасувати')}
          </button>
          <button
            onClick={handleConfirm}
            className={`w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded-2xl transition-all cursor-pointer shadow-sm text-center ${confirmBtnClass}`}
          >
            {confirmLabel || confirmText || t('common.confirm', 'Підтвердити')}
          </button>
        </div>
      </div>
    </div>
  );
};
