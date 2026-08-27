import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import {
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
import { MessageAreaSkeleton } from '../../../../components/common/Skeleton';

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
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useCallback((behavior: 'auto' | 'smooth' = 'auto') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (!conversation) return;

    scrollToBottom('auto');
    const t1 = setTimeout(() => scrollToBottom('auto'), 50);
    const t2 = setTimeout(() => scrollToBottom('auto'), 150);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [messages.length, conversation?.id, scrollToBottom]);

  const handleImageLoad = () => {
    scrollToBottom('auto');
  };

  const groupedMessages = useMemo(() => {
    const groups: { date: string; msgs: MessageResponse[] }[] = [];
    let currentDate = '';
    const visibleMessages = messages.filter(m => !(m.content && m.content.startsWith('🖱️ ')));
    visibleMessages.forEach(m => {
      const dk = getDateKey(m.createdAt);
      if (dk !== currentDate) {
        currentDate = dk;
        groups.push({ date: m.createdAt, msgs: [m] });
      } else {
        groups[groups.length - 1].msgs.push(m);
      }
    });
    return groups;
  }, [messages]);

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

      <div className="flex-1 overflow-y-auto px-5 py-4 bg-[#F2EBDD] font-['JetBrains_Mono',monospace]" style={{ scrollbarWidth: 'none' }}>
        {isMsgLoading ? (
          <MessageAreaSkeleton />
        ) : groupedMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-[#0A0A0A] font-bold italic">No messages in this conversation.</div>
        ) : (
          groupedMessages.map((group, gi) => (
            <div key={gi}>
              <div className="flex items-center justify-center my-4">
                <span className="text-[10px] text-[#0A0A0A] font-black uppercase bg-white border-2 border-[#0A0A0A] px-3 py-1 rounded-full shadow-[2px_2px_0px_0px_#0A0A0A]">
                  {formatDateSeparator(group.date)}
                </span>
              </div>
              {group.msgs.map(m => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  isOwner={m.senderType === 'OWNER'}
                  ownerAvatar={<OwnerAvatar size={28} />}
                  userAvatar={<UserAvatar name={conversation.botUserName} photoUrl={conversation.botUserPhotoUrl} size={28} />}
                  allMessages={messages}
                  onButtonClick={onButtonClick}
                  onImageLoad={handleImageLoad}
                />
              ))}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </>
  );
};
