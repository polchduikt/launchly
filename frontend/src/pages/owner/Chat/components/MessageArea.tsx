import React, { useMemo, useEffect, useCallback } from 'react';
import {
  Loader2,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';
import type { ConversationResponse, MessageResponse } from '../../../../types/crm';
import type { BotUserResponse } from '../../../../types/bot';
import { UserAvatar } from './UserAvatar';
import { OwnerAvatar } from './OwnerAvatar';
import { MessageBubble } from './MessageBubble';
import { ChatToolbar } from './ChatToolbar';
import { formatDateSeparator, getDateKey } from '../../../../utils/crmChat';
import { t } from '../../../../i18n/config';
import { useVirtualList } from '../../../../hooks/useVirtualList';

interface MessageAreaProps {
  conversation: ConversationResponse | null;
  botUser?: BotUserResponse;
  messages: MessageResponse[];
  isMsgLoading: boolean;
  onButtonClick: (label: string) => void;
  infoPanelOpen?: boolean;
  onToggleInfoPanel?: () => void;
  onCloseConversation?: () => void;
  onMarkUnread?: () => void;
  onPause?: (durationMs: number | null) => void;
  onResume?: () => void;
  onAddLabel?: (label: string) => void;
  onRemoveLabel?: (label: string) => void;
  onSetReminder?: (ts: number | null) => void;
  allLabels?: string[];
  isPaused?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onDeleteGlobalLabel?: (label: string) => void;
  meta?: Record<string, unknown>;
}

type FlatChatMessage =
  | { type: 'date'; key: string; date: string }
  | { type: 'message'; key: string; message: MessageResponse };

export const MessageArea: React.FC<MessageAreaProps> = ({
  conversation,
  botUser,
  messages,
  isMsgLoading,
  onButtonClick,
  infoPanelOpen = true,
  onToggleInfoPanel = () => {},
  onCloseConversation = () => {},
  onMarkUnread = () => {},
  onPause = () => {},
  onResume = () => {},
  onAddLabel = () => {},
  onRemoveLabel = () => {},
  onSetReminder = () => {},
  allLabels = [],
  isPaused = false,
  isFavorite = false,
  onToggleFavorite = () => {},
  onDeleteGlobalLabel = () => {},
  meta = {},
}) => {
  const flatItems = useMemo<FlatChatMessage[]>(() => {
    const items: FlatChatMessage[] = [];
    let currentDate = '';
    const visibleMessages = messages.filter(m => !(m.content && m.content.startsWith('🖱️ ')));
    visibleMessages.forEach(m => {
      const dk = getDateKey(m.createdAt);
      if (dk !== currentDate) {
        currentDate = dk;
        items.push({ type: 'date', key: `date-${dk}`, date: m.createdAt });
      }
      items.push({ type: 'message', key: `msg-${m.id}`, message: m });
    });
    return items;
  }, [messages]);

  const getItemHeight = useCallback((index: number): number => {
    const item = flatItems[index];
    if (!item) return 72;
    if (item.type === 'date') return 48;
    const length = item.message.content?.length || 0;
    if (length > 250) return 160;
    if (length > 120) return 110;
    return 72;
  }, [flatItems]);

  const { parentRef, virtualItems, totalHeight, scrollToIndex } = useVirtualList({
    count: flatItems.length,
    itemHeight: getItemHeight,
    overscan: 6,
  });

  const handleImageLoad = () => {
    if (flatItems.length > 0) {
      scrollToIndex(flatItems.length - 1, 'end');
    }
  };

  useEffect(() => {
    if (!conversation) return;
    if (flatItems.length > 0) {
      scrollToIndex(flatItems.length - 1, 'end');
      const timer = setTimeout(() => {
        scrollToIndex(flatItems.length - 1, 'end');
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [flatItems.length, conversation?.id, scrollToIndex]);

  if (!conversation) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-[#0A0A0A] gap-3 bg-[#F2EBDD] font-['JetBrains_Mono',monospace]">
        <MessageSquare size={48} strokeWidth={1.5} className="text-[#0A0A0A]" />
        <span className="font-['Anybody',sans-serif] text-base font-black uppercase text-[#0A0A0A]">{t('crm.chat.select_placeholder_title')}</span>
        <span className="text-xs text-slate-700 font-bold">{t('crm.chat.select_placeholder_desc')}</span>
      </div>
    );
  }

  return (
    <>
      <div className="h-[56px] min-h-[56px] px-5 border-b-2 border-[#0A0A0A] flex items-center justify-between shrink-0 bg-[#F2EBDD] font-['JetBrains_Mono',monospace]">
        <div className="flex items-center gap-3">
          <UserAvatar name={conversation.botUserName} photoUrl={conversation.botUserPhotoUrl} size={34} />
          <div>
            <h3 className="font-['Anybody',sans-serif] font-black text-sm text-[#0A0A0A] uppercase tracking-tight">{conversation.botUserName}</h3>
            {conversation.botUserUsername && (
              <button
                onClick={() => window.open(`https://t.me/${conversation.botUserUsername}`, '_blank')}
                className="text-[10px] text-[#0A0A0A] font-bold hover:underline cursor-pointer flex items-center gap-0.5"
              >
                @{conversation.botUserUsername} <ExternalLink size={9} />
              </button>
            )}
          </div>
        </div>

        <ChatToolbar
          conversation={conversation}
          botUser={botUser}
          infoPanelOpen={infoPanelOpen}
          onToggleInfoPanel={onToggleInfoPanel}
          onCloseConversation={onCloseConversation}
          onMarkUnread={onMarkUnread}
          onPause={onPause}
          onResume={onResume}
          onAddLabel={onAddLabel}
          onRemoveLabel={onRemoveLabel}
          onDeleteGlobalLabel={onDeleteGlobalLabel}
          onSetReminder={onSetReminder}
          allLabels={allLabels}
          isPaused={isPaused}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
          meta={meta}
        />
      </div>

      <div ref={parentRef} className="flex-1 overflow-y-auto px-5 py-4 bg-[#F2EBDD] font-['JetBrains_Mono',monospace]" style={{ scrollbarWidth: 'none' }}>
        {isMsgLoading ? (
          <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-[#0A0A0A]" size={24} /></div>
        ) : flatItems.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-[#0A0A0A] font-bold italic">No messages in this conversation.</div>
        ) : (
          <div style={{ height: `${totalHeight}px`, width: '100%', position: 'relative' }}>
            {virtualItems.map(({ index, offsetTop, size }) => {
              const item = flatItems[index];
              if (!item) return null;

              if (item.type === 'date') {
                return (
                  <div
                    key={item.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${size}px`,
                      transform: `translateY(${offsetTop}px)`,
                    }}
                    className="flex items-center justify-center"
                  >
                    <span className="text-[10px] text-[#0A0A0A] font-black uppercase bg-white border-2 border-[#0A0A0A] px-3 py-1 rounded-full shadow-[2px_2px_0px_0px_#0A0A0A]">
                      {formatDateSeparator(item.date)}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={item.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${offsetTop}px)`,
                  }}
                >
                  <MessageBubble
                    message={item.message}
                    isOwner={item.message.senderType === 'OWNER'}
                    ownerAvatar={<OwnerAvatar size={28} />}
                    userAvatar={<UserAvatar name={conversation.botUserName} photoUrl={conversation.botUserPhotoUrl} size={28} />}
                    allMessages={messages}
                    onButtonClick={onButtonClick}
                    onImageLoad={handleImageLoad}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};
