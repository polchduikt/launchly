import React, { useEffect, useState, useCallback } from 'react';
import { WifiOff, RefreshCw, CheckCircle2, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useNetworkStore } from '../../store/useNetworkStore';
import { t } from '../../i18n/config';

export const NetworkStatusBanner: React.FC = () => {
  const queryClient = useQueryClient();
  const { isOnline, webSocketStatus, hasBeenOffline, setOnline, setHasBeenOffline } = useNetworkStore();
  const [showRestored, setShowRestored] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [debouncedReconnecting, setDebouncedReconnecting] = useState(false);

  useEffect(() => {
    if (webSocketStatus === 'reconnecting') {
      const timer = setTimeout(() => {
        setDebouncedReconnecting(true);
      }, 1200);
      return () => clearTimeout(timer);
    } else {
      setDebouncedReconnecting(false);
    }
  }, [webSocketStatus]);

  const handleOnline = useCallback(() => {
    setOnline(true);
    setShowRestored(true);
    queryClient.invalidateQueries();

    const timer = setTimeout(() => {
      setShowRestored(false);
      setHasBeenOffline(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, [setOnline, setHasBeenOffline, queryClient]);

  const handleOffline = useCallback(() => {
    setOnline(false);
    setShowRestored(false);
  }, [setOnline]);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  const handleManualRetry = async () => {
    setIsRetrying(true);
    try {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        setOnline(true);
        setHasBeenOffline(false);
        setDebouncedReconnecting(false);
        await queryClient.invalidateQueries();
        setShowRestored(true);
        setTimeout(() => {
          setShowRestored(false);
        }, 3000);
      }
    } finally {
      setIsRetrying(false);
    }
  };

  if (!isOnline) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="w-full bg-rose-600 text-white border-b-2 border-[#0A0A0A] px-4 py-2.5 font-['JetBrains_Mono',monospace] text-xs font-bold shadow-[0_2px_0px_#0A0A0A] z-[9999] relative animate-fade-in"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 text-center sm:text-left">
            <div className="w-6 h-6 rounded-lg bg-white border-2 border-[#0A0A0A] flex items-center justify-center shrink-0 text-rose-600 shadow-[1px_1px_0px_#0A0A0A]">
              <WifiOff size={14} />
            </div>
            <span>
              {t(
                'network.offline_message',
                'Відсутнє підключення до Інтернету. Перейдіть в онлайн для синхронізації змін.'
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={handleManualRetry}
            disabled={isRetrying}
            className="px-3 py-1 bg-white text-[#0A0A0A] border-2 border-[#0A0A0A] rounded-lg shadow-[2px_2px_0px_#0A0A0A] hover:bg-slate-100 uppercase tracking-wider text-[11px] font-black cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
          >
            {isRetrying ? (
              <RefreshCw size={12} className="animate-spin inline mr-1" />
            ) : null}
            {t('network.retry_btn', 'Повторити')}
          </button>
        </div>
      </div>
    );
  }

  if (isOnline && debouncedReconnecting && hasBeenOffline) {
    return (
      <div
        role="alert"
        aria-live="polite"
        className="w-full bg-amber-300 text-[#0A0A0A] border-b-2 border-[#0A0A0A] px-4 py-2 font-['JetBrains_Mono',monospace] text-xs font-bold shadow-[0_2px_0px_#0A0A0A] z-[9999] relative animate-fade-in"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <RefreshCw size={14} className="animate-spin text-[#0A0A0A] shrink-0" />
            <span>
              {t(
                'network.reconnecting_message',
                "З'єднання в реальному часі втрачено. Відновлення зв'язку із сервером..."
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={handleManualRetry}
            className="px-2.5 py-0.5 bg-[#0A0A0A] text-[#F2EBDD] border border-[#0A0A0A] rounded text-[10px] uppercase font-black cursor-pointer hover:bg-white hover:text-[#0A0A0A] transition-all"
          >
            {t('network.reconnect_btn', 'Перепідключити')}
          </button>
        </div>
      </div>
    );
  }

  if (showRestored) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="w-full bg-emerald-400 text-[#0A0A0A] border-b-2 border-[#0A0A0A] px-4 py-2 font-['JetBrains_Mono',monospace] text-xs font-black shadow-[0_2px_0px_#0A0A0A] z-[9999] relative animate-fade-in"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[#0A0A0A] shrink-0" />
            <span>
              {t('network.restored_message', "Підключення відновлено. Дані успішно синхронізовані.")}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowRestored(false)}
            className="p-1 hover:bg-[#0A0A0A]/10 rounded cursor-pointer transition-all"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return null;
};
