import React from 'react';
import { AudioLines, Play, Paperclip } from 'lucide-react';
import type { MessageResponse } from '../../../types/crm';
import { formatMessageTime, parseMessageButtons } from '../utils/chat';

interface MessageBubbleProps {
  message: MessageResponse;
  isOwner: boolean;
  ownerAvatar: React.ReactNode;
  userAvatar: React.ReactNode;
  allMessages: MessageResponse[];
  onButtonClick: (label: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message: m,
  isOwner,
  ownerAvatar,
  userAvatar,
  allMessages,
  onButtonClick,
}) => {
  const { text: cleanText, buttons } = parseMessageButtons(m.content);

  const renderButtons = () => {
    if (buttons.length === 0) return null;
    const msgIndex = allMessages.findIndex(msg => msg.id === m.id);
    let clickedButtonLabel: string | null = null;
    if (msgIndex !== -1) {
      for (let i = msgIndex + 1; i < allMessages.length; i++) {
        const nextMsg = allMessages[i];
        if (nextMsg.senderType === 'BOT_USER') {
          const cleanNextText = nextMsg.content ? nextMsg.content.replace('🖱️ ', '').trim() : '';
          if (buttons.some(btn => btn.trim().toLowerCase() === cleanNextText.toLowerCase())) {
            clickedButtonLabel = cleanNextText;
          }
          break;
        }
      }
    }

    return (
      <div className={`mt-1.5 flex flex-col gap-1 w-full max-w-[280px] ${isOwner ? 'ml-auto' : 'mr-auto'}`}>
        {buttons.map((btnLabel, idx) => {
          const isClicked = clickedButtonLabel && btnLabel.trim().toLowerCase() === clickedButtonLabel.toLowerCase();
          const hasSelection = clickedButtonLabel !== null;
          return (
            <button
              key={idx}
              onClick={() => onButtonClick(btnLabel)}
              className={`w-full py-2 px-4 text-center text-[13px] font-semibold rounded-lg transition-all cursor-pointer select-none border ${
                isClicked
                  ? 'bg-[#0088cc] text-white border-[#0088cc] shadow-sm'
                  : hasSelection
                  ? 'bg-slate-50/50 text-slate-400 border-slate-200/50 opacity-60'
                  : 'bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-[#0088cc] border-slate-200'
              }`}
            >
              {btnLabel}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`flex items-end gap-2 mb-3 ${isOwner ? 'flex-row-reverse' : ''}`}>
      {isOwner ? ownerAvatar : userAvatar}
      <div className="max-w-[60%]">
        {m.mediaUrl && m.mediaType === 'image' && (
          <div className={`mb-1 rounded-2xl overflow-hidden shadow-sm relative group ${isOwner ? 'rounded-br-md' : 'rounded-bl-md'}`}>
            <img src={m.mediaUrl} alt="Photo" className="max-w-full max-h-[300px] object-cover" />
            <div className="absolute bottom-1.5 right-2 bg-black/40 px-1 py-0.5 rounded text-[9px] text-white backdrop-blur-[1px]">
              {formatMessageTime(m.createdAt)}
            </div>
          </div>
        )}
        {m.mediaUrl && m.mediaType === 'voice' && (
          <div className={`mb-1 px-4 py-2.5 rounded-2xl shadow-sm flex items-center gap-2 ${isOwner ? 'bg-[#0088cc] text-white rounded-br-none' : 'bg-slate-100 text-slate-700 rounded-bl-none'}`}>
            <AudioLines size={16} />
            <span className="text-[13px]">Voice message</span>
            <a href={m.mediaUrl} target="_blank" rel="noreferrer" className="opacity-70 hover:opacity-100"><Play size={14} /></a>
            <span className="text-[9px] opacity-60 ml-auto self-end shrink-0">
              {formatMessageTime(m.createdAt)}
            </span>
          </div>
        )}
        {m.mediaUrl && m.mediaType === 'document' && (
          <div className={`mb-1 px-4 py-2.5 rounded-2xl shadow-sm flex items-center gap-2 ${isOwner ? 'bg-[#0088cc] text-white rounded-br-none' : 'bg-slate-100 text-slate-700 rounded-bl-none'}`}>
            <Paperclip size={14} />
            <a href={m.mediaUrl} target="_blank" rel="noreferrer" className="text-[13px] underline truncate max-w-[160px]">{cleanText.replace('📎 ', '')}</a>
            <span className="text-[9px] opacity-60 ml-auto self-end shrink-0">
              {formatMessageTime(m.createdAt)}
            </span>
          </div>
        )}
        {cleanText && !(m.mediaUrl && (cleanText === '📷 Photo' || cleanText === '🎤 Voice message')) && m.mediaType !== 'document' && (
          <div className={`px-4 py-2.5 text-[13px] leading-relaxed shadow-sm whitespace-pre-wrap break-words flex flex-col ${isOwner ? 'bg-[#0088cc] text-white rounded-2xl rounded-br-none' : 'bg-slate-100 text-slate-800 rounded-2xl rounded-bl-none'}`}>
            <span>{cleanText}</span>
            <span className="text-[9px] text-right mt-1 opacity-60 self-end shrink-0">
              {formatMessageTime(m.createdAt)}
            </span>
          </div>
        )}
        {renderButtons()}
      </div>
    </div>
  );
};
