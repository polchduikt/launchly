import React from 'react';
import {
  Send,
  UserCheck,
  Lock,
  CheckCircle2,
  Clock,
  X,
  Loader2,
} from 'lucide-react';
import { useTranslation } from '../../../../i18n/config';
import type { AdminSupportTicket, AdminSupportMessage } from '../../../../api/admin';

interface AdminChatThreadProps {
  selectedTicket?: AdminSupportTicket | null;
  currentUserEmail?: string;
  replyText: string;
  setReplyText: (text: string) => void;
  onSendMessage: (e?: React.FormEvent) => void;
  isSending: boolean;
  onClaimTicket: () => void;
  isClaiming: boolean;
  onCompleteDialog: () => void;
  onResolveDialog: () => void;
  isStatusToggling: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

const formatShortTime = (timeStr?: string | null): string => {
  if (!timeStr) return '';
  try {
    const d = new Date(timeStr);
    if (isNaN(d.getTime())) return timeStr;
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    return timeStr || '';
  }
};

export const AdminChatThread: React.FC<AdminChatThreadProps> = ({
  selectedTicket,
  currentUserEmail,
  replyText,
  setReplyText,
  onSendMessage,
  isSending,
  onClaimTicket,
  isClaiming,
  onCompleteDialog,
  onResolveDialog,
  isStatusToggling,
  messagesEndRef,
}) => {
  const { t } = useTranslation();

  if (!selectedTicket) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-700 text-xs font-bold">
        {t('admin.select_chat_hint')}
      </div>
    );
  }

  const isClosedOrResolved =
    selectedTicket.status === 'RESOLVED' || (selectedTicket.status as string) === 'CLOSED';
  const isNotAssigned = !selectedTicket.assignedManagerEmail;
  const isAssignedToOther =
    Boolean(selectedTicket.assignedManagerEmail) &&
    selectedTicket.assignedManagerEmail !== currentUserEmail;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F2EBDD] min-w-0">
      <header className="h-16 px-6 bg-[#F2EBDD] border-b-2 border-[#0A0A0A] flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3.5 min-w-0">
          {selectedTicket.userAvatar ? (
            <img
              src={selectedTicket.userAvatar}
              alt={selectedTicket.userName}
              className="w-10 h-10 rounded-xl object-cover border-2 border-[#0A0A0A] shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-amber-200 border-2 border-[#0A0A0A] flex items-center justify-center font-black text-[#0A0A0A] text-sm shrink-0 shadow-[2px_2px_0px_#0A0A0A]">
              {(selectedTicket.userName || 'U')[0].toUpperCase()}
            </div>
          )}

          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-['Anybody',sans-serif] text-sm font-black uppercase text-[#0A0A0A] truncate">
                {selectedTicket.userName}
              </h3>
              <span className="px-2 py-0.5 rounded-lg bg-white border-2 border-[#0A0A0A] text-[#0A0A0A] font-black text-[10px] uppercase font-mono">
                {selectedTicket.userPlan}
              </span>
            </div>
            <div className="text-xs text-slate-700 font-mono font-bold truncate">
              {selectedTicket.userEmail}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6 overflow-y-auto overflow-x-hidden custom-scrollbar space-y-4 min-w-0 select-text">
        {(selectedTicket.messages || []).map((msg: AdminSupportMessage) => {
          if ((msg.sender as string) === 'SYSTEM') {
            let managerName = selectedTicket.assignedManagerName || '';
            if (!managerName) {
              const cleaned = msg.text
                .replace(/^До діалогу приєднався менеджер\s*/i, '')
                .replace(/^Manager\s*/i, '')
                .replace(/\s*joined the dialog$/i, '')
                .replace(/\{0\}/g, '')
                .trim();
              if (cleaned) managerName = cleaned;
            }
            if (!managerName) managerName = t('admin.support_team', 'Служба підтримки');
            return (
              <div key={msg.id} className="flex justify-center my-2">
                <div className="px-4 py-1.5 rounded-xl bg-amber-200 border-2 border-[#0A0A0A] text-[#0A0A0A] text-[11px] font-black uppercase shadow-[2px_2px_0px_#0A0A0A] flex items-center gap-1.5">
                  <UserCheck size={13} className="text-[#0A0A0A]" />
                  <span>{t('admin.system_manager_joined', { name: managerName })}</span>
                </div>
              </div>
            );
          }
          const isManagerMsg = msg.sender === 'MANAGER';
          return (
            <div
              key={msg.id}
              className={`flex flex-col max-w-lg ${
                isManagerMsg ? 'items-end ml-auto' : 'items-start mr-auto'
              }`}
            >
              <div className="flex items-center space-x-2 mb-1 px-1">
                <span className="text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider">
                  {isManagerMsg ? t('admin.support_team') : msg.senderName}
                </span>
                <span className="text-[10px] font-mono text-slate-700 font-bold">
                  {formatShortTime(msg.timestamp)}
                </span>
              </div>

              <div
                className={`p-3.5 rounded-2xl text-xs leading-relaxed border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] break-all [word-break:break-word] whitespace-pre-wrap ${
                  isManagerMsg
                    ? 'bg-[#0A0A0A] text-[#F2EBDD] rounded-tr-xs font-bold'
                    : 'bg-white text-[#0A0A0A] rounded-tl-xs font-bold'
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-[#F2EBDD] border-t-2 border-[#0A0A0A] space-y-3 shrink-0">
        {isClosedOrResolved ? (
          <div className="p-3 bg-white border-2 border-[#0A0A0A] rounded-2xl text-center space-y-1 shadow-[2px_2px_0px_#0A0A0A]">
            <div className="text-xs font-black uppercase text-[#0A0A0A] flex items-center justify-center gap-1.5">
              <CheckCircle2 size={15} className="text-[#0A0A0A]" />
              <span>{t('admin.dialog_closed_title')}</span>
            </div>
            <p className="text-[11px] text-slate-700 font-bold">
              {t('admin.dialog_closed_desc')}
            </p>
          </div>
        ) : isNotAssigned ? (
          <div className="p-4 bg-white border-2 border-[#0A0A0A] rounded-2xl flex flex-col items-center justify-center space-y-2 text-center shadow-[2px_2px_0px_#0A0A0A]">
            <div className="text-xs font-black uppercase text-[#0A0A0A]">
              {t('admin.dialog_not_assigned_title')}
            </div>
            <button
              type="button"
              onClick={onClaimTicket}
              disabled={isClaiming}
              className="px-6 py-2.5 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-[#F2EBDD] font-black uppercase border-2 border-[#0A0A0A] text-xs rounded-xl transition flex items-center space-x-2 shadow-[2px_2px_0px_#0A0A0A] cursor-pointer disabled:opacity-50"
            >
              {isClaiming ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <UserCheck size={16} />
              )}
              <span>{t('admin.start_dialog_btn')}</span>
            </button>
          </div>
        ) : isAssignedToOther ? (
          <div className="p-3 bg-white border-2 border-[#0A0A0A] rounded-2xl text-center space-y-1 shadow-[2px_2px_0px_#0A0A0A]">
            <div className="text-xs font-black uppercase text-[#0A0A0A] flex items-center justify-center gap-1.5">
              <Lock size={15} className="text-[#0A0A0A]" />
              <span>
                {t('admin.dialog_assigned_to_title', {
                  name:
                    selectedTicket.assignedManagerName ||
                    selectedTicket.assignedManagerEmail ||
                    '',
                })}
              </span>
            </div>
            <p className="text-[11px] text-slate-700 font-bold">
              {t('admin.dialog_assigned_to_desc')}
            </p>
          </div>
        ) : (
          <div className="p-3 bg-white border-2 border-[#0A0A0A] rounded-2xl flex items-center justify-between gap-3 shadow-[2px_2px_0px_#0A0A0A]">
            <div className="text-xs font-black uppercase text-[#0A0A0A] flex items-center gap-2">
              <Clock size={15} className="text-[#0A0A0A]" />
              <span>{t('admin.dialog_actions_label')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onCompleteDialog}
                disabled={isStatusToggling}
                className="px-3.5 py-1.5 bg-rose-200 hover:bg-rose-300 text-rose-950 border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase transition flex items-center space-x-1.5 cursor-pointer shadow-[2px_2px_0px_#0A0A0A] disabled:opacity-50"
              >
                <X size={14} />
                <span>{t('admin.complete_dialog')}</span>
              </button>
              <button
                type="button"
                onClick={onResolveDialog}
                disabled={isStatusToggling}
                className="px-3.5 py-1.5 bg-emerald-200 hover:bg-emerald-300 text-emerald-950 border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase transition flex items-center space-x-1.5 cursor-pointer shadow-[2px_2px_0px_#0A0A0A] disabled:opacity-50"
              >
                <CheckCircle2 size={14} />
                <span>{t('admin.resolve_dialog')}</span>
              </button>
            </div>
          </div>
        )}

        <form onSubmit={onSendMessage} className="flex items-center space-x-3">
          <input
            type="text"
            placeholder={
              isClosedOrResolved
                ? t('admin.placeholder_dialog_closed')
                : isNotAssigned
                ? t('admin.placeholder_start_dialog')
                : isAssignedToOther
                ? t('admin.placeholder_other_manager')
                : t('admin.type_reply_placeholder')
            }
            value={replyText}
            disabled={isClosedOrResolved || isNotAssigned || isAssignedToOther}
            onChange={(e) => setReplyText(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-white border-2 border-[#0A0A0A] rounded-2xl text-xs font-bold text-[#0A0A0A] placeholder-slate-500 focus:outline-none transition shadow-[2px_2px_0px_#0A0A0A] disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={
              !replyText.trim() ||
              isSending ||
              isClosedOrResolved ||
              isNotAssigned ||
              isAssignedToOther
            }
            className="px-5 py-2.5 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-[#F2EBDD] font-black uppercase text-xs border-2 border-[#0A0A0A] rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center space-x-1.5 shadow-[2px_2px_0px_#0A0A0A] cursor-pointer"
          >
            {isSending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            <span>{t('admin.send_btn')}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
