import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { t } from '../../i18n/config';
import { GOOGLE_OAUTH_URL } from '../../const/auth';
import { TelegramLoginModal } from '../../pages/public/Login/components/TelegramLoginModal';
import { unlinkTelegramApi } from '../../api/auth';

interface ManageSignInOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManageSignInOptionsModal: React.FC<ManageSignInOptionsModalProps> = ({ isOpen, onClose }) => {
  const { user, setUser } = useAuthStore();
  const [isTelegramOpen, setIsTelegramOpen] = useState(false);

  if (!isOpen) return null;

  const isGoogleConnected = user?.provider === 'GOOGLE' || user?.email.endsWith('@gmail.com');
  const isTelegramConnected = !!user?.telegramUserId;

  const handleConnectGoogle = () => {
    window.location.href = GOOGLE_OAUTH_URL;
  };

  const handleDisconnectTelegram = async () => {
    try {
      await unlinkTelegramApi();
      if (user) {
        setUser({ ...user, telegramUserId: null, telegramUsername: null });
      }
    } catch (err) {
      console.error('Failed to unlink telegram', err);
    }
  };

  return (
    <>
      <div 
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0A]/50 font-['JetBrains_Mono',monospace] select-none transition-all duration-300 cursor-pointer p-4"
      >
        <div 
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-xl p-6 md:p-8 bg-[#F2EBDD] rounded-3xl border-2 border-[#0A0A0A] shadow-[8px_8px_0px_0px_#0A0A0A] transform transition-all animate-in fade-in zoom-in-95 duration-200 cursor-default"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b-2 border-[#0A0A0A] mb-6">
            <div>
              <h2 className="font-['Anybody',sans-serif] text-lg font-black text-[#0A0A0A] uppercase tracking-tight">
                {t('auth.signin.manage_title')}
              </h2>
              <p className="text-xs text-slate-700 font-bold mt-1">
                {t('auth.signin.manage_desc')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-all cursor-pointer shrink-0 ml-4"
            >
              <X size={16} />
            </button>
          </div>

          {/* Options */}
          <div className="space-y-4">
            {/* Google */}
            <div className="flex items-center justify-between p-4 bg-white border-2 border-[#0A0A0A] rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F2EBDD] border-2 border-[#0A0A0A] shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-['Anybody',sans-serif] text-xs font-black text-[#0A0A0A] uppercase">Google</h4>
                  {isGoogleConnected ? (
                    <span className="text-[10px] font-bold text-slate-700 block mt-0.5">
                      {user?.email}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-500 block mt-0.5">{t('auth.signin.not_connected')}</span>
                  )}
                </div>
              </div>

              {isGoogleConnected ? (
                <div className="px-4 py-1.5 border-2 border-[#0A0A0A] bg-[#F2EBDD] text-[#0A0A0A] text-xs font-black uppercase rounded-xl flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-700" />
                  <span>{t('auth.signin.connected')}</span>
                </div>
              ) : (
                <button
                  onClick={handleConnectGoogle}
                  className="px-5 py-1.5 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-[#F2EBDD] border-2 border-[#0A0A0A] text-xs font-black uppercase rounded-xl transition-all cursor-pointer"
                >
                  {t('auth.signin.connect')}
                </button>
              )}
            </div>

            {/* Telegram */}
            <div className="flex items-center justify-between p-4 bg-white border-2 border-[#0A0A0A] rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-sky-100 border-2 border-[#0A0A0A] text-sky-600 shrink-0">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.18-.08-.04-.19-.01-.27.01-.12.02-2.03 1.28-5.73 3.77-.54.37-1.03.55-1.47.54-.48-.01-1.4-.27-2.08-.49-.83-.27-1.5-.42-1.44-.89.03-.24.37-.49 1.03-.74 4.05-1.76 6.74-2.92 8.09-3.48 3.85-1.6 4.64-1.88 5.17-1.89.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.16-.03.22z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-['Anybody',sans-serif] text-xs font-black text-[#0A0A0A] uppercase">Telegram</h4>
                  {isTelegramConnected ? (
                    <span className="text-[10px] font-bold text-slate-700 block mt-0.5">
                      {user?.telegramUsername ? `@${user.telegramUsername}` : `ID: ${user?.telegramUserId}`}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-500 block mt-0.5">{t('auth.signin.not_connected')}</span>
                  )}
                </div>
              </div>

              {isTelegramConnected ? (
                <div className="flex items-center gap-2">
                  <div className="px-4 py-1.5 border-2 border-[#0A0A0A] bg-[#F2EBDD] text-[#0A0A0A] text-xs font-black uppercase rounded-xl flex items-center gap-1.5">
                    <Check size={14} className="text-emerald-700" />
                    <span>{t('auth.signin.connected')}</span>
                  </div>
                  <button
                    onClick={handleDisconnectTelegram}
                    className="px-4 py-1.5 border-2 border-rose-600 bg-rose-100 hover:bg-rose-600 hover:text-white text-rose-800 text-xs font-black uppercase rounded-xl transition-all cursor-pointer"
                  >
                    {t('auth.signin.disconnect')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsTelegramOpen(true)}
                  className="px-5 py-1.5 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-[#F2EBDD] border-2 border-[#0A0A0A] text-xs font-black uppercase rounded-xl transition-all cursor-pointer"
                >
                  {t('auth.signin.connect')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <TelegramLoginModal
        isOpen={isTelegramOpen}
        onClose={() => setIsTelegramOpen(false)}
        onSuccess={() => {}}
      />
    </>
  );
};
