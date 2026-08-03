import React, { useEffect, useState, useRef } from 'react';
import { X, Loader2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../../store/useAuthStore';
import { createTelegramSessionApi, checkTelegramSessionStatusApi } from '../../../../api/auth';
import { useTranslation } from '../../../../i18n/config';

interface TelegramLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  isSubscription?: boolean;
}

export const TelegramLoginModal: React.FC<TelegramLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isSubscription = false,
}) => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, setStatus] = useState<'PENDING' | 'SUCCESS' | 'EXPIRED'>('PENDING');

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startSession = async () => {
    setLoading(true);
    setError(null);
    setStatus('PENDING');
    try {
      const response = await createTelegramSessionApi(isSubscription);
      setToken(response.token);
      setBotUsername(response.botUsername);
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(
        message ||
          t('auth.telegram_modal.expired', 'The authorization session has expired. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startSession();
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      setToken(null);
      setBotUsername(null);
      setError(null);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (token) {
      pollingRef.current = setInterval(async () => {
        try {
          const res = await checkTelegramSessionStatusApi(token);
          if (res.status === 'SUCCESS' && res.accessToken && res.refreshToken && res.user) {
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
            setStatus('SUCCESS');
            login(res.accessToken, res.refreshToken, res.user);

            if (onSuccess) {
              onSuccess();
            } else {
              navigate('/dashboard');
            }
            onClose();
          } else if (res.status === 'EXPIRED') {
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
            setStatus('EXPIRED');
            setError(
              t(
                'auth.telegram_modal.expired',
                'The authorization session has expired. Please try again.'
              )
            );
          }
        } catch (err) {
          console.error('Polling error', err);
        }
      }, 1500);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [token]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0A]/40 p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#F2EBDD] border-4 border-[#0A0A0A] shadow-[8px_8px_0px_#0A0A0A] p-6 sm:p-8 transform transition-all animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white border-2 border-[#0A0A0A] text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer rounded-lg"
          aria-label="Close"
        >
          <X size={18} strokeWidth={2.5} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-[#229ED9] border-3 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] rounded-2xl flex items-center justify-center mb-4">
            <svg
              className="w-9 h-9 fill-white"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.18-.08-.04-.19-.01-.27.01-.12.02-2.03 1.28-5.73 3.77-.54.37-1.03.55-1.47.54-.48-.01-1.4-.27-2.08-.49-.83-.27-1.5-.42-1.44-.89.03-.24.37-.49 1.03-.74 4.05-1.76 6.74-2.92 8.09-3.48 3.85-1.6 4.64-1.88 5.17-1.89.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.16-.03.22z" />
            </svg>
          </div>

          <h2 className="font-['Anybody',sans-serif] font-black text-2xl uppercase tracking-tight text-[#0A0A0A]">
            {t('auth.telegram_modal.title', 'Telegram Authorization')}
          </h2>
          <p className="text-xs sm:text-sm text-[#0A0A0A]/75 font-bold mt-1.5 px-2">
            {t('auth.telegram_modal.subtitle', 'Follow the steps below to securely authorize your account.')}
          </p>

          <div className="w-full mt-6 space-y-4">
            {loading && (
              <div className="py-8 flex flex-col items-center justify-center space-y-3 bg-white border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] rounded-xl p-4">
                <Loader2 className="animate-spin text-[#0A0A0A]" size={28} />
                <span className="font-['JetBrains_Mono',monospace] text-xs font-extrabold uppercase text-[#0A0A0A]">
                  {t('auth.telegram_modal.creating', 'Creating authorization session...')}
                </span>
              </div>
            )}

            {error && (
              <div className="p-4 bg-rose-200 border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] rounded-xl text-[#0A0A0A] text-xs font-bold text-left leading-relaxed">
                <p>{error}</p>
                <button
                  onClick={startSession}
                  className="mt-3 w-full py-2.5 bg-[#0A0A0A] text-[#F2EBDD] hover:bg-white hover:text-[#0A0A0A] border-2 border-[#0A0A0A] rounded-lg font-['JetBrains_Mono',monospace] font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[2px_2px_0px_#0A0A0A]"
                >
                  {t('auth.telegram_modal.try_again', 'Try Again')}
                </button>
              </div>
            )}

            {!loading && !error && token && botUsername && (
              <div className="space-y-5">
                <div className="bg-white border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] rounded-xl p-4 text-left">
                  <h4 className="font-['JetBrains_Mono',monospace] text-xs font-black text-[#0A0A0A] uppercase tracking-wider mb-2.5 pb-1.5 border-b border-[#0A0A0A]/20">
                    {t('auth.telegram_modal.instructions_title', 'LOGIN INSTRUCTIONS:')}
                  </h4>
                  <ol className="list-decimal list-inside text-xs text-[#0A0A0A] font-semibold space-y-2 leading-relaxed">
                    <li>{t('auth.telegram_modal.step1', 'Click the button below to open our official Telegram Assistant Bot.')}</li>
                    <li>
                      {t('auth.telegram_modal.step2', 'In Telegram, click the "Start" (/start) button at the bottom of the chat.')}
                    </li>
                    <li>{t('auth.telegram_modal.step3', 'Your account will authorize automatically within a few seconds!')}</li>
                  </ol>
                </div>

                <div className="flex flex-col gap-3">
                  <a
                    href={`tg://resolve?domain=${botUsername}&start=${token}`}
                    className="w-full py-3.5 px-4 bg-[#0A0A0A] text-[#F2EBDD] hover:bg-[#229ED9] hover:text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none rounded-xl font-['JetBrains_Mono',monospace] font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                  >
                    <span>{t('auth.telegram_modal.btn_open', 'Open Telegram App')}</span>
                    <ExternalLink size={16} strokeWidth={2.5} />
                  </a>

                  <a
                    href={`https://t.me/${botUsername}?start=${token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-['JetBrains_Mono',monospace] text-xs font-bold text-[#0A0A0A]/70 hover:text-[#0A0A0A] hover:underline underline-offset-4 transition-all block mt-0.5"
                  >
                    {t('auth.telegram_modal.web_link', 'Trouble opening? Open in browser (t.me)')}
                  </a>
                </div>

                <div className="py-2 px-3 bg-amber-300 border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] rounded-lg inline-flex items-center justify-center gap-2 font-['JetBrains_Mono',monospace] text-xs font-black text-[#0A0A0A] uppercase tracking-wider animate-pulse">
                  <Loader2 className="animate-spin text-[#0A0A0A]" size={14} strokeWidth={2.5} />
                  <span>{t('auth.telegram_modal.waiting', 'Waiting for you to click Start in Telegram...')}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelegramLoginModal;
