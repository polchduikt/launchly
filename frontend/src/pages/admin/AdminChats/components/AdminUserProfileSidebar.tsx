import React from 'react';
import {
  PanelRightClose,
  PanelRightOpen,
  Calendar,
  Clock,
  Key,
  Send,
  Bot,
  Workflow,
  Users,
  MessageSquare
} from 'lucide-react';
import { useTranslation } from '../../../../i18n/config';

interface AdminUserProfileSidebarProps {
  selectedTicket: any;
  isProfileCollapsed: boolean;
  setIsProfileCollapsed: (collapsed: boolean) => void;
  onOpenDetails: () => void;
}

export const AdminUserProfileSidebar: React.FC<AdminUserProfileSidebarProps> = ({
  selectedTicket,
  isProfileCollapsed,
  setIsProfileCollapsed,
  onOpenDetails,
}) => {
  const { t } = useTranslation();

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return (
        d.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
        ' ' +
        d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    } catch {
      return dateStr;
    }
  };

  const getAuthProviderLabel = (provider?: string) => {
    if (!provider) return 'Email / Пароль';
    if (provider.toUpperCase() === 'GOOGLE') return 'Google OAuth';
    if (provider.toUpperCase() === 'TELEGRAM') return 'Telegram';
    return 'Email / Пароль';
  };

  if (!selectedTicket) return null;

  if (isProfileCollapsed) {
    return (
      <aside
        onClick={() => setIsProfileCollapsed(false)}
        className="w-14 bg-[#F2EBDD] hover:bg-white border-l-2 border-[#0A0A0A] h-full flex items-center justify-center shrink-0 cursor-pointer transition select-none z-10"
        title="Показати інфо про клієнта"
      >
        <PanelRightOpen size={22} className="text-[#0A0A0A]" />
      </aside>
    );
  }

  return (
    <aside className="w-80 bg-[#F2EBDD] border-l-2 border-[#0A0A0A] h-full flex flex-col shrink-0 z-10 select-text">
      <div className="h-16 px-5 border-b-2 border-[#0A0A0A] flex items-center justify-between shrink-0">
        <h5 className="font-['Anybody',sans-serif] text-xs font-black uppercase text-[#0A0A0A]">
          {t('admin.client_info')}
        </h5>
        <button
          onClick={() => setIsProfileCollapsed(true)}
          className="p-1 rounded-lg text-[#0A0A0A] hover:bg-white border-2 border-transparent hover:border-[#0A0A0A] transition cursor-pointer"
          title="Сховати інфо про клієнта"
        >
          <PanelRightClose size={16} />
        </button>
      </div>

      <div className="p-5 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
        <div className="text-center space-y-2 border-b-2 border-[#0A0A0A] pb-4">
          {selectedTicket.userAvatar ? (
            <img
              src={selectedTicket.userAvatar}
              alt={selectedTicket.userName}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-[#0A0A0A] mx-auto shadow-[2px_2px_0px_#0A0A0A]"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-amber-200 border-2 border-[#0A0A0A] flex items-center justify-center font-black text-[#0A0A0A] text-xl mx-auto shadow-[2px_2px_0px_#0A0A0A]">
              {(selectedTicket.userName || 'U')[0].toUpperCase()}
            </div>
          )}
          <div>
            <h4 className="font-black text-[#0A0A0A] text-sm">{selectedTicket.userName}</h4>
            <p className="text-xs text-slate-700 font-mono font-bold truncate">{selectedTicket.userEmail}</p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="px-2.5 py-0.5 rounded-lg bg-white border-2 border-[#0A0A0A] text-[#0A0A0A] font-black text-[10px] uppercase font-mono">
              {selectedTicket.userPlan}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-lg border-2 border-[#0A0A0A] font-black text-[10px] uppercase font-mono ${
                selectedTicket.accountActive !== false
                  ? 'bg-emerald-200 text-emerald-950'
                  : 'bg-rose-200 text-rose-950'
              }`}
            >
              {selectedTicket.accountActive !== false ? t('admin.status_active_user') : t('admin.status_blocked_user')}
            </span>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <h5 className="font-black text-[10px] uppercase tracking-wider text-[#0A0A0A]">
            {t('admin.activity_and_stats')}
          </h5>

          <div className="bg-white p-3.5 rounded-2xl border-2 border-[#0A0A0A] space-y-2.5 font-bold shadow-[2px_2px_0px_#0A0A0A]">
            <div className="flex items-center justify-between text-[#0A0A0A]">
              <span className="flex items-center gap-1.5"><Calendar size={13} /> {t('admin.reg_date')}</span>
              <span className="font-black text-[#0A0A0A] font-mono text-[11px]">
                {formatDate(selectedTicket.registeredAt)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[#0A0A0A]">
              <span className="flex items-center gap-1.5"><Clock size={13} /> {t('admin.last_activity')}</span>
              <span className="font-black text-[#0A0A0A] font-mono text-[11px]">
                {formatDate(selectedTicket.lastActivityAt)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[#0A0A0A]">
              <span className="flex items-center gap-1.5"><Key size={13} /> {t('admin.auth_provider')}</span>
              <span className="font-black text-[#0A0A0A] font-mono text-[11px]">
                {getAuthProviderLabel(selectedTicket.authProvider)}
              </span>
            </div>
            {selectedTicket.telegramUserId && (
              <div className="flex items-center justify-between text-[#0A0A0A]">
                <span className="flex items-center gap-1.5"><Send size={13} /> {t('admin.telegram_id')}</span>
                <span className="font-black text-[#0A0A0A] font-mono text-[11px]">
                  {selectedTicket.telegramUserId}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <h5 className="font-black text-[10px] uppercase tracking-wider text-[#0A0A0A]">
            Ресурси користувача
          </h5>

          <div className="bg-white p-3.5 rounded-2xl border-2 border-[#0A0A0A] space-y-2 font-bold shadow-[2px_2px_0px_#0A0A0A]">
            <div className="flex items-center justify-between text-[#0A0A0A]">
              <span className="flex items-center gap-1.5"><Bot size={13} /> {t('admin.bots_label')}</span>
              <span className="font-black font-mono text-[#0A0A0A]">{selectedTicket.botsCount}</span>
            </div>
            <div className="flex items-center justify-between text-[#0A0A0A]">
              <span className="flex items-center gap-1.5"><Workflow size={13} /> {t('admin.automations_label')}</span>
              <span className="font-black font-mono text-[#0A0A0A]">{selectedTicket.automationsCount}</span>
            </div>
            <div className="flex items-center justify-between text-[#0A0A0A]">
              <span className="flex items-center gap-1.5"><Send size={13} /> {t('admin.broadcasts_label')}</span>
              <span className="font-black font-mono text-[#0A0A0A]">{selectedTicket.broadcastsCount}</span>
            </div>
            <div className="flex items-center justify-between text-[#0A0A0A]">
              <span className="flex items-center gap-1.5"><Users size={13} /> {t('admin.subscribers')}</span>
              <span className="font-black font-mono text-[#0A0A0A]">{selectedTicket.contactsCount ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-[#0A0A0A]">
              <span className="flex items-center gap-1.5"><MessageSquare size={13} /> {t('admin.messages_sent')}</span>
              <span className="font-black font-mono text-[#0A0A0A]">{selectedTicket.messagesCount ?? 0}</span>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={onOpenDetails}
            className="w-full py-2.5 px-3 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-[#F2EBDD] rounded-xl border-2 border-[#0A0A0A] text-xs font-black uppercase transition flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_#0A0A0A]"
          >
            <span>{t('admin.more_details')}</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
