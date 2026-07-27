import React from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { t } from '../../../i18n/config';

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 cursor-default animate-fade-in"
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            {isDanger && <AlertTriangle size={18} className="text-rose-500 shrink-0" />}
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed font-semibold">{message}</p>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer"
            >
              {cancelText || t('broadcast.dialog.cancel') || 'Cancel'}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                isDanger
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-100'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
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
