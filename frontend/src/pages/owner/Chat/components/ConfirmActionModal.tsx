import React from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { t } from '../../../../i18n/config';

interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  isLoading?: boolean;
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  isDanger = false,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0A]/40 p-4 cursor-pointer font-['JetBrains_Mono',monospace]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#F2EBDD] rounded-3xl border-2 border-[#0A0A0A] max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 cursor-default"
      >
        <div className="px-6 py-5 border-b-2 border-[#0A0A0A] flex items-center justify-between">
          <h3 className="font-['Anybody',sans-serif] text-base font-black text-[#0A0A0A] uppercase tracking-tight flex items-center gap-2">
            {isDanger && <AlertTriangle size={18} className="text-rose-600 shrink-0" />}
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-all cursor-pointer shadow-sm"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-xs text-[#0A0A0A] leading-relaxed font-bold uppercase">{message}</p>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-[#0A0A0A] bg-white border-2 border-[#0A0A0A] rounded-xl hover:bg-[#0A0A0A] hover:text-white transition-all cursor-pointer text-center"
            >
              {cancelText || t('broadcast.dialog.cancel') || 'Cancel'}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-center ${
                isDanger
                  ? 'border-2 border-rose-600 bg-rose-100 hover:bg-rose-600 hover:text-white text-rose-800'
                  : 'border-2 border-[#0A0A0A] bg-[#0A0A0A] text-white hover:bg-white hover:text-[#0A0A0A]'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                confirmText || 'Confirm'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
