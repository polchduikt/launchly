import React from 'react';
import { Heart } from 'lucide-react';
import type { ConversationResponse } from '../../../../types/crm';
import { UserAvatar } from './UserAvatar';
import { timeAgo } from '../../../../utils/crmChat';
import { t } from '../../../../i18n/config';
import { useVirtualList } from '../../../../hooks/useVirtualList';

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
}) => {
  const { parentRef, virtualItems, totalHeight } = useVirtualList({
    count: conversations.length,
    itemHeight: 68,
    overscan: 4,
  });

  return (
    <div className="w-[280px] border-r-2 border-[#0A0A0A] flex flex-col bg-[#F2EBDD] shrink-0 overflow-hidden font-['JetBrains_Mono',monospace]">
      <div ref={parentRef} className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {isLoading && conversations.length === 0 ? (
          <div className="animate-pulse flex-1 p-4" />
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#0A0A0A] font-bold italic">
            {searchQuery
              ? t('crm.list.no_conversations_found')
              : chatFilter === 'open'
              ? t('crm.list.no_open_conversations')
              : chatFilter === 'closed'
              ? t('crm.list.no_closed_conversations')
              : t('crm.list.no_conversations')}
          </div>
        ) : (
          <div style={{ height: `${totalHeight}px`, width: '100%', position: 'relative' }}>
            {virtualItems.map(({ index, offsetTop, size }) => {
              const c = conversations[index];
              if (!c) return null;
              const isSel = c.id === selectedConvId;
              const isFav = favorites.includes(c.id);
              const isUnrd = c.unread || unreadConvIds.includes(c.id);

              return (
                <div
                  key={c.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(c.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelect(c.id);
                    }
                  }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${size}px`,
                    transform: `translateY(${offsetTop}px)`,
                  }}
                  className={`w-full text-left px-4 py-3 flex items-start gap-2.5 transition-all cursor-pointer border-b-2 border-[#0A0A0A] group ${isSel ? 'bg-white font-black' : 'bg-[#F2EBDD] hover:bg-white'}`}
                >
                  <div className="relative shrink-0">
                    <UserAvatar name={c.botUserName} photoUrl={c.botUserPhotoUrl} size={36} />
                    {isUnrd && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#0A0A0A] rounded-full border-2 border-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className={`text-xs uppercase truncate ${isUnrd ? 'font-black text-[#0A0A0A]' : 'font-bold text-[#0A0A0A]'}`}>{c.botUserName}</span>
                      <span className="text-[10px] text-slate-700 font-bold shrink-0 ml-1">{timeAgo(c.lastMessageAt)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-0.5">
                      <p className={`text-xs truncate ${isUnrd ? 'text-[#0A0A0A] font-bold' : 'text-slate-700 font-medium'}`}>{c.lastMessage || 'No messages'}</p>
                      {c.botName && (
                        <span className="text-[9px] bg-white text-[#0A0A0A] border border-[#0A0A0A] px-1.5 py-0.5 rounded font-black uppercase shrink-0 ml-1">
                          {c.botName}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(c.id); }}
                    className={`shrink-0 mt-0.5 transition-all cursor-pointer ${isFav ? 'text-rose-600' : 'text-transparent group-hover:text-[#0A0A0A]'}`}
                  >
                    <Heart size={13} className={isFav ? 'fill-rose-600' : ''} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
