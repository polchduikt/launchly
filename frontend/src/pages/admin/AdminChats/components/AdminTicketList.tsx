import React from 'react';
import { MessageSquare, Loader2, Star } from 'lucide-react';
import { useTranslation } from '../../../../i18n/config';
import type { AdminSupportTicket } from '../../../../api/admin';

interface AdminTicketListProps {
  tickets: AdminSupportTicket[];
  selectedTicketId: number | null;
  isTicketsLoading: boolean;
  onSelectTicket: (id: number) => void;
  onToggleFavorite: (id: number, e: React.MouseEvent) => void;
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

export const AdminTicketList: React.FC<AdminTicketListProps> = ({
  tickets,
  selectedTicketId,
  isTicketsLoading,
  onSelectTicket,
  onToggleFavorite,
}) => {
  const { t } = useTranslation();

  return (
    <aside className="w-80 lg:w-84 bg-[#F2EBDD] border-r-2 border-[#0A0A0A] h-full flex flex-col shrink-0 z-10">
      <div className="h-16 px-4 border-b-2 border-[#0A0A0A] flex items-center justify-between shrink-0">
        <h3 className="font-['Anybody',sans-serif] text-xs font-black uppercase text-[#0A0A0A] flex items-center gap-2">
          <MessageSquare size={16} className="text-[#0A0A0A]" />
          <span>{t('admin.chats_title')}</span>
        </h3>
        <span className="px-2.5 py-0.5 rounded-lg bg-white border-2 border-[#0A0A0A] text-[#0A0A0A] font-black text-[11px] shadow-[2px_2px_0px_#0A0A0A]">
          {tickets.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar divide-y-2 divide-[#0A0A0A]/20">
        {isTicketsLoading ? (
          <div className="flex items-center justify-center py-16 text-[#0A0A0A] text-xs font-bold">
            <Loader2 size={16} className="animate-spin mr-2" />
            <span>{t('admin.loading_chats')}</span>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16 text-slate-700 text-xs font-bold px-4">
            {t('admin.no_chats_found')}
          </div>
        ) : (
          tickets.map((c) => {
            const isSelected = c.id === selectedTicketId;
            return (
              <div
                key={c.id}
                onClick={() => onSelectTicket(c.id)}
                className={`p-3.5 flex items-start gap-3 transition cursor-pointer relative ${
                  isSelected ? 'bg-white border-l-4 border-[#0A0A0A]' : 'hover:bg-white/60'
                }`}
              >
                <div className="relative shrink-0">
                  {c.userAvatar ? (
                    <img
                      src={c.userAvatar}
                      alt={c.userName}
                      className="w-10 h-10 rounded-xl object-cover border-2 border-[#0A0A0A]"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-amber-200 border-2 border-[#0A0A0A] flex items-center justify-center font-black text-[#0A0A0A] text-xs shadow-[2px_2px_0px_#0A0A0A]">
                      {(c.userName || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  {c.unread && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-[#0A0A0A]" />
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs truncate ${
                        c.unread ? 'font-black text-[#0A0A0A]' : 'font-bold text-[#0A0A0A]'
                      }`}
                    >
                      {c.userName}
                    </span>
                    <span className="text-[10px] font-mono text-slate-700 shrink-0 ml-1 font-bold">
                      {formatShortTime(c.lastMessageTime)}
                    </span>
                  </div>

                  <p
                    className={`text-[11px] truncate ${
                      c.unread ? 'font-black text-[#0A0A0A]' : 'text-slate-700 font-bold'
                    }`}
                  >
                    {c.lastMessage || '...'}
                  </p>
                </div>

                <button
                  onClick={(e) => onToggleFavorite(c.id, e)}
                  className={`p-1 rounded-lg transition hover:bg-[#F2EBDD] shrink-0 cursor-pointer ${
                    c.isFavorite ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'
                  }`}
                  title={c.isFavorite ? 'Remove favorite' : 'Add to favorites'}
                >
                  <Star size={14} fill={c.isFavorite ? 'currentColor' : 'none'} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
