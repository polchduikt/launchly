import React from 'react';
import { AlertTriangle } from 'lucide-react';

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
  confirmLabel = 'Підтвердити',
  cancelLabel = 'Скасувати',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const confirmBtnClass =
    variant === 'danger'
      ? 'bg-rose-500 hover:bg-rose-600 text-white'
      : variant === 'warning'
      ? 'bg-amber-500 hover:bg-amber-600 text-white'
      : 'bg-indigo-600 hover:bg-indigo-700 text-white';

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-16 px-4"
      style={{ backgroundColor: 'rgba(148, 163, 184, 0.35)' }}
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-sm overflow-hidden animate-fade-in-down"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-5 pt-5 pb-4">
          <div className={`p-2 rounded-xl shrink-0 ${
            variant === 'danger' ? 'bg-rose-50' : variant === 'warning' ? 'bg-amber-50' : 'bg-indigo-50'
          }`}>
            <AlertTriangle
              size={18}
              className={variant === 'danger' ? 'text-rose-500' : variant === 'warning' ? 'text-amber-500' : 'text-indigo-500'}
            />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 leading-tight">{title}</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100 mx-5" />

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${confirmBtnClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
