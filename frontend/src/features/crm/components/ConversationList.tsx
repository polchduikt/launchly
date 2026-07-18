import React from 'react';
import { Loader2, Heart } from 'lucide-react';
import type { ConversationResponse } from '../../../types/crm';
import { UserAvatar } from './UserAvatar';
import { timeAgo } from '../utils/chat';
import { t } from '../../../i18n';

interface ConversationListProps {
  conversations: ConversationResponse[];
  selectedConvId: number | null;
  onSelect: (id: number) => void;
  isLoading: boolean;
  favorites: number[];
  onToggleFavorite: (id: number) => void;
  unreadConvIds: number[];
  searchQuery: string;
  chatFilter: string;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConvId,
  onSelect,
  isLoading,
  favorites,
  onToggleFavorite,
  unreadConvIds,
  searchQuery,
  chatFilter,
}) => (
  <div className="w-[280px] border-r border-slate-200 flex flex-col bg-white shrink-0 overflow-hidden">
    <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
      {isLoading ? (
        <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-indigo-600" size={20} /></div>
      ) : conversations.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 italic">
          {searchQuery
            ? t('crm.list.no_conversations_found')
            : chatFilter === 'open'
            ? t('crm.list.no_open_conversations')
            : chatFilter === 'closed'
            ? t('crm.list.no_closed_conversations')
            : t('crm.list.no_conversations')}
        </div>
      ) : (
        conversations.map(c => {
          const isSel = c.id === selectedConvId;
          const isFav = favorites.includes(c.id);
          const isUnrd = c.unread || unreadConvIds.includes(c.id);
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`w-full text-left px-4 py-3.5 flex items-start gap-2.5 transition-all cursor-pointer border-b border-slate-50 group ${isSel ? 'bg-indigo-50/60' : 'hover:bg-slate-50'}`}
            >
              <div className="relative shrink-0">
                <UserAvatar name={c.botUserName} photoUrl={c.botUserPhotoUrl} size={36} />
                {isUnrd && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className={`text-[13px] truncate ${isUnrd ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>{c.botUserName}</span>
                  <span className="text-[10px] text-slate-400 shrink-0 ml-1">{timeAgo(c.lastMessageAt)}</span>
                </div>
                <div className="flex justify-between items-center mt-0.5">
                  <p className={`text-[12px] truncate ${isUnrd ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>{c.lastMessage || 'No messages'}</p>
                  {c.botName && (
                    <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded shrink-0 font-medium ml-1">
                      {c.botName}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(c.id); }}
                className={`shrink-0 mt-0.5 transition-all cursor-pointer ${isFav ? 'text-red-500' : 'text-transparent group-hover:text-slate-300'}`}
              >
                <Heart size={13} className={isFav ? 'fill-red-500' : ''} />
              </button>
            </button>
          );
        })
      )}
    </div>
  </div>
);
