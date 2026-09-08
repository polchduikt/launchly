import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToastStore, type ToastItem } from '../../store/useToastStore';

const TOAST_THEMES = {
  success: {
    bg: 'bg-emerald-200',
    border: 'border-[#0A0A0A]',
    text: 'text-[#0A0A0A]',
    icon: CheckCircle2,
    iconColor: 'text-[#0A0A0A]',
  },
  error: {
    bg: 'bg-rose-200',
    border: 'border-[#0A0A0A]',
    text: 'text-[#0A0A0A]',
    icon: AlertCircle,
    iconColor: 'text-[#0A0A0A]',
  },
  warning: {
    bg: 'bg-amber-200',
    border: 'border-[#0A0A0A]',
    text: 'text-[#0A0A0A]',
    icon: AlertTriangle,
    iconColor: 'text-[#0A0A0A]',
  },
  info: {
    bg: 'bg-sky-200',
    border: 'border-[#0A0A0A]',
    text: 'text-[#0A0A0A]',
    icon: Info,
    iconColor: 'text-[#0A0A0A]',
  },
};

const SingleToast: React.FC<{ toast: ToastItem; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    if (!toast.duration || toast.duration <= 0) return;
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const theme = TOAST_THEMES[toast.type] || TOAST_THEMES.info;
  const Icon = theme.icon;

  return (
    <div
      role="alert"
      className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border-2 ${theme.border} ${theme.bg} ${theme.text} shadow-[4px_4px_0px_0px_#0A0A0A] font-['JetBrains_Mono',monospace] transition-all animate-in fade-in slide-in-from-top-2 duration-200 max-w-md w-full`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon size={18} className={`${theme.iconColor} shrink-0`} />
        <span className="text-xs font-bold break-words leading-snug">{toast.message}</span>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Close notification"
        className="p-1 -mr-1 rounded-lg hover:bg-black/10 transition-colors shrink-0 cursor-pointer"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const toasts = useToastStore((state) => state.toasts);
  const dismissToast = useToastStore((state) => state.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-[99999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toastItem) => (
        <SingleToast key={toastItem.id} toast={toastItem} onDismiss={dismissToast} />
      ))}
    </div>
  );
};
