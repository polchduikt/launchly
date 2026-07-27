import React, { useMemo } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useMessagesQuery } from '../hooks/useCrmQueries';
import { UserAvatar } from './UserAvatar';
import { OwnerAvatar } from './OwnerAvatar';
import { MessageBubble } from './MessageBubble';
import { formatDateSeparator, getDateKey } from '../utils/chat';
import { t } from '../../../i18n/config';
import type { ConversationResponse } from '../../../types/crm';

interface ChatHistoryModalProps {
  conversation: ConversationResponse;
  onClose: () => void;
}

export const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({
  conversation,
  onClose,
}) => {
  const { data: messages = [], isLoading } = useMessagesQuery(conversation.id);

  const groupedMessages = useMemo(() => {
    const groups: { date: string; msgs: any[] }[] = [];
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

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 select-none animate-fade-in cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-100 animate-scale-up cursor-default"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 select-none">
          <h3 className="text-base font-bold text-slate-800 flex-1 text-center">
            {t('crm.panel.history_btn')}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-100 bg-slate-50/50 select-none">
          <UserAvatar name={conversation.botUserName} photoUrl={conversation.botUserPhotoUrl} size={36} />
          <div>
            <h4 className="font-semibold text-sm text-slate-800">{conversation.botUserName}</h4>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold">
              <span>Me</span>
              <span className="text-[9px] translate-y-[0.5px]">▼</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 max-h-[50vh]" style={{ scrollbarWidth: 'none' }}>
          {isLoading ? (
            <div className="py-20 flex items-center justify-center">
              <Loader2 className="animate-spin text-indigo-600" size={24} />
            </div>
          ) : messages.length === 0 ? (
            <div className="py-20 text-center text-xs text-slate-400 italic">
              No messages in this conversation.
            </div>
          ) : (
            groupedMessages.map((group, gi) => (
              <div key={gi}>
                <div className="flex items-center justify-center my-4">
                  <span className="text-[11px] text-slate-400 font-semibold">{formatDateSeparator(group.date)}</span>
                </div>
                {group.msgs.map((m) => (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    isOwner={m.senderType === 'OWNER'}
                    ownerAvatar={<OwnerAvatar size={28} />}
                    userAvatar={<UserAvatar name={conversation.botUserName} photoUrl={conversation.botUserPhotoUrl} size={28} />}
                    allMessages={messages}
                    onButtonClick={() => {}}
                  />
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
