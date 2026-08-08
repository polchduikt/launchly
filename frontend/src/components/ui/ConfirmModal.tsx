import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from '../../i18n/config';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const confirmBtnClass =
    variant === 'danger'
      ? 'bg-rose-200 hover:bg-rose-300 text-[#0A0A0A] border-2 border-[#0A0A0A]'
      : variant === 'warning'
      ? 'bg-amber-200 hover:bg-amber-300 text-[#0A0A0A] border-2 border-[#0A0A0A]'
      : 'bg-[#0A0A0A] hover:bg-indigo-700 text-[#F2EBDD] border-2 border-[#0A0A0A]';

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-16 px-4 font-['JetBrains_Mono',monospace]"
      style={{ backgroundColor: 'rgba(10, 10, 10, 0.5)' }}
      onClick={onCancel}
    >
      <div
        className="bg-[#F2EBDD] rounded-2xl shadow-2xl border-2 border-[#0A0A0A] w-full max-w-sm overflow-hidden animate-fade-in-down cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 px-5 pt-5 pb-4">
          <div className="p-2 rounded-xl shrink-0 bg-white border-2 border-[#0A0A0A] text-[#0A0A0A]">
            <AlertTriangle size={18} className="text-[#0A0A0A]" />
          </div>
          <div>
            <h3 className="font-['Anybody',sans-serif] text-sm font-black text-[#0A0A0A] uppercase leading-tight">{title}</h3>
            <p className="text-xs text-slate-700 font-bold mt-1 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="h-0.5 bg-[#0A0A0A]/15 mx-5" />
        <div className="flex items-center justify-end gap-2 px-5 py-3.5">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold text-[#0A0A0A] bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl transition-all cursor-pointer"
          >
            {cancelLabel || t('common.cancel', 'Скасувати')}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-black uppercase rounded-xl transition-all cursor-pointer ${confirmBtnClass}`}
          >
            {confirmLabel || t('common.confirm', 'Підтвердити')}
          </button>
        </div>
      </div>
    </div>
  );
};
