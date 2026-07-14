import React, { useEffect, useState, useRef } from 'react';
import { X, Loader2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { createTelegramSessionApi, checkTelegramSessionStatusApi } from '../api/auth';

interface TelegramLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  isSubscription?: boolean;
}

export const TelegramLoginModal: React.FC<TelegramLoginModalProps> = ({ isOpen, onClose, onSuccess, isSubscription = false }) => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'PENDING' | 'SUCCESS' | 'EXPIRED'>('PENDING');

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const startSession = async () => {
    setLoading(true);
    setError(null);
    setStatus('PENDING');
    try {
      const response = await createTelegramSessionApi(isSubscription);
      setToken(response.token);
      setBotUsername(response.botUsername);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to initialize Telegram session');
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
            setError('The authorization session has expired. Please try again.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 transition-all duration-300">
      <div className="relative w-full max-w-md p-6 bg-white rounded-3xl shadow-xl border border-slate-100 transform transition-all animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center mt-2">
          <div className="w-16 h-16 flex items-center justify-center bg-blue-50 text-blue-500 rounded-3xl mb-4">
            <svg
              className="w-8 h-8 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.18-.08-.04-.19-.01-.27.01-.12.02-2.03 1.28-5.73 3.77-.54.37-1.03.55-1.47.54-.48-.01-1.4-.27-2.08-.49-.83-.27-1.5-.42-1.44-.89.03-.24.37-.49 1.03-.74 4.05-1.76 6.74-2.92 8.09-3.48 3.85-1.6 4.64-1.88 5.17-1.89.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.16-.03.22z" />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-slate-800">Telegram Authorization</h2>
          <p className="text-sm text-slate-400 mt-2 px-4 leading-relaxed">
            Follow the steps below to securely authorize your account.
          </p>

          <div className="w-full mt-6 space-y-4">
            {loading && (
              <div className="py-6 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="animate-spin text-blue-500" size={24} />
                <span className="text-xs font-semibold text-slate-500">Creating authorization session...</span>
              </div>
            )}

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-semibold leading-relaxed">
                {error}
                <button
                  onClick={startSession}
                  className="mt-3 w-full py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl transition-all font-bold cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            )}

            {!loading && !error && token && botUsername && (
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Instructions:</h4>
                  <ol className="list-decimal list-inside text-xs text-slate-600 space-y-2 leading-relaxed">
                    <li>Click the link below to open our official Telegram Assistant Bot.</li>
                    <li>In the Telegram application, click the <strong className="text-slate-800">"Start"</strong> button at the bottom of the chat.</li>
                    <li>Your account will authorize automatically within a few seconds!</li>
                  </ol>
                </div>

                <div className="flex flex-col gap-2">
                  <a
                    href={`tg://resolve?domain=${botUsername}&start=${token}`}
                    className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-bold text-sm transition-all shadow-md shadow-blue-100 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Open Telegram App</span>
                    <ExternalLink size={14} />
                  </a>

                  <a
                    href={`https://t.me/${botUsername}?start=${token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:text-blue-600 hover:underline transition-all block mt-1"
                  >
                    Trouble opening? Open in browser (t.me)
                  </a>
                </div>

                <div className="py-2 flex items-center justify-center gap-2 text-xs font-bold text-slate-400 select-none animate-pulse">
                  <Loader2 className="animate-spin text-slate-400" size={14} />
                  <span>Waiting for you to click Start in Telegram...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
