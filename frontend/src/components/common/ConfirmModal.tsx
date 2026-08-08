import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0A0A]/40 font-['JetBrains_Mono',monospace]">
      <div className="bg-white border-2 border-[#0A0A0A] shadow-[8px_8px_0px_#0A0A0A] w-full max-w-md p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 rounded-xl">
        
        <div className="flex items-center justify-between border-b-2 border-[#0A0A0A] pb-3">
          <div className="flex items-center gap-2 font-black text-sm uppercase text-[#0A0A0A]">
            <AlertTriangle className={isDanger ? 'text-rose-600' : 'text-amber-500'} size={18} />
            <span>{title}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 border border-[#0A0A0A] text-[#0A0A0A] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-xs font-bold text-slate-700 leading-relaxed">
          {message}
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border-2 border-[#0A0A0A] text-xs font-black uppercase text-[#0A0A0A] cursor-pointer"
          >
            {cancelText || t('common.cancel', 'Скасувати')}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-5 py-2 bg-indigo-600 border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] text-xs font-black uppercase text-white cursor-pointer ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {confirmText || t('common.confirm', 'Підтвердити')}
          </button>
        </div>

      </div>
    </div>
  );
};
