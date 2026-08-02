import React from 'react';
import { AudioLines, Play, Paperclip, Clock } from 'lucide-react';
import type { MessageResponse } from '../../../../types/crm';
import { formatMessageTime, parseMessageButtons } from '../../../../utils/crmChat';

interface MessageBubbleProps {
  message: MessageResponse;
  isOwner: boolean;
  ownerAvatar: React.ReactNode;
  userAvatar: React.ReactNode;
  allMessages: MessageResponse[];
  onButtonClick: (label: string) => void;
  onImageLoad?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message: m,
  isOwner: _isOwner,
  ownerAvatar,
  userAvatar: _userAvatar,
  allMessages,
  onButtonClick,
  onImageLoad,
}) => {
  const isNote = m.senderType === 'NOTE';
  const isOwner = isNote ? true : _isOwner;
  const { text: cleanText, buttons } = parseMessageButtons(m.content);

  if (isNote) {
    return (
      <div data-message-id={m.id} className="flex items-end gap-2 mb-3 flex-row-reverse font-['JetBrains_Mono',monospace]">
        {ownerAvatar}
        <div className="max-w-[60%]">
          <div className="px-4 py-2.5 text-xs font-bold leading-relaxed border-2 border-[#0A0A0A] whitespace-pre-wrap break-words flex flex-col bg-amber-200 text-[#0A0A0A] rounded-2xl rounded-br-none w-full shadow-[2px_2px_0px_0px_#0A0A0A]">
            <span>{m.content}</span>
            <span className="text-[9px] text-right mt-1 opacity-70 self-end shrink-0 font-bold">
              {formatMessageTime(m.createdAt)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const hasButtons = buttons.length > 0;

  let clickedButtonLabel: string | null = null;
  if (hasButtons) {
    const msgIndex = allMessages.findIndex(msg => msg.id === m.id);
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
  }

  return (
    <div data-message-id={m.id} className={`flex items-end gap-2 mb-3 font-['JetBrains_Mono',monospace] ${isOwner ? 'flex-row-reverse' : ''}`}>
      {isOwner ? ownerAvatar : _userAvatar}
      {hasButtons ? (
        <div className="w-72 rounded-2xl border-2 border-[#0A0A0A] shadow-[2px_2px_0px_0px_#0A0A0A] overflow-hidden flex flex-col">
          {m.mediaUrl && m.mediaType === 'image' && (
            <div className="relative group">
              <img 
                src={m.mediaUrl} 
                alt="Photo" 
                className="w-full max-h-[300px] object-cover" 
                onLoad={onImageLoad}
              />
              <div className="absolute bottom-1.5 right-2 bg-[#0A0A0A]/80 px-1.5 py-0.5 rounded-md text-[9px] text-[#F2EBDD] font-bold flex items-center gap-1">
                {m.sent === false && <Clock size={10} className="animate-pulse" />}
                <span>{formatMessageTime(m.scheduledAt || m.createdAt)}</span>
              </div>
            </div>
          )}
          {m.mediaUrl && m.mediaType === 'voice' && (
            <div className={`px-4 py-2.5 flex items-center gap-2 ${isOwner ? 'bg-[#0A0A0A] text-[#F2EBDD]' : 'bg-white text-[#0A0A0A]'}`}>
              <AudioLines size={16} />
              <span className="text-xs font-bold">Voice message</span>
              <a href={m.mediaUrl} target="_blank" rel="noreferrer" className="opacity-80 hover:opacity-100"><Play size={14} /></a>
              <span className="text-[9px] opacity-70 ml-auto self-end shrink-0 flex items-center gap-1 font-bold">
                {m.sent === false && <Clock size={10} className="animate-pulse" />}
                <span>{formatMessageTime(m.scheduledAt || m.createdAt)}</span>
              </span>
            </div>
          )}
          {m.mediaUrl && m.mediaType === 'document' && (
            <div className={`px-4 py-2.5 flex items-center gap-2 ${isOwner ? 'bg-[#0A0A0A] text-[#F2EBDD]' : 'bg-white text-[#0A0A0A]'}`}>
              <Paperclip size={14} />
              <a href={m.mediaUrl} target="_blank" rel="noreferrer" className="text-xs font-bold underline truncate max-w-[160px]">{cleanText.replace('📎 ', '')}</a>
              <span className="text-[9px] opacity-70 ml-auto self-end shrink-0 flex items-center gap-1 font-bold">
                {m.sent === false && <Clock size={10} className="animate-pulse" />}
                <span>{formatMessageTime(m.scheduledAt || m.createdAt)}</span>
              </span>
            </div>
          )}
          {cleanText && !(m.mediaUrl && (cleanText === '📷 Photo' || cleanText === '🎤 Voice message')) && m.mediaType !== 'document' && (
            <div className={`px-4 py-2.5 text-xs font-bold leading-relaxed whitespace-pre-wrap break-words flex flex-col ${
              isOwner ? 'bg-[#0A0A0A] text-[#F2EBDD]' : 'bg-white text-[#0A0A0A]'
            } w-full`}>
              <span>{cleanText}</span>
              <span className="text-[9px] text-right mt-1 opacity-70 self-end shrink-0 flex items-center gap-1 font-bold">
                {m.sent === false && <Clock size={10} className="animate-pulse" />}
                <span>{formatMessageTime(m.scheduledAt || m.createdAt)}</span>
              </span>
            </div>
          )}

          <div className="flex flex-col w-full">
            {buttons.map((btnLabel, idx) => {
              const isClicked = clickedButtonLabel && btnLabel.trim().toLowerCase() === clickedButtonLabel.toLowerCase();
              const hasSelection = clickedButtonLabel !== null;
              return (
                <button
                  key={idx}
                  onClick={() => onButtonClick(btnLabel)}
                  className={`w-full py-2.5 px-4 text-center text-xs font-black uppercase transition-all cursor-pointer select-none border-t-2 border-[#0A0A0A] ${
                    isClicked
                      ? 'bg-emerald-400 text-[#0A0A0A]'
                      : hasSelection
                      ? 'bg-slate-100 text-slate-400 opacity-60'
                      : 'bg-white hover:bg-[#F2EBDD] text-[#0A0A0A]'
                  }`}
                >
                  {btnLabel}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="max-w-[60%]">
          {m.mediaUrl && m.mediaType === 'image' && (
            <div className={`mb-1 rounded-2xl overflow-hidden border-2 border-[#0A0A0A] shadow-[2px_2px_0px_0px_#0A0A0A] relative group ${
              isOwner ? 'rounded-br-md' : 'rounded-bl-md'
            }`}>
              <img 
                src={m.mediaUrl} 
                alt="Photo" 
                className="max-w-full max-h-[300px] object-cover" 
                onLoad={onImageLoad}
              />
              <div className="absolute bottom-1.5 right-2 bg-[#0A0A0A]/80 px-1.5 py-0.5 rounded-md text-[9px] text-[#F2EBDD] font-bold flex items-center gap-1">
                {m.sent === false && <Clock size={10} className="animate-pulse" />}
                <span>{formatMessageTime(m.scheduledAt || m.createdAt)}</span>
              </div>
            </div>
          )}
          {m.mediaUrl && m.mediaType === 'voice' && (
            <div className={`mb-1 px-4 py-2.5 rounded-2xl border-2 border-[#0A0A0A] shadow-[2px_2px_0px_0px_#0A0A0A] flex items-center gap-2 ${
              isOwner ? 'bg-[#0A0A0A] text-[#F2EBDD] rounded-br-none' : 'bg-white text-[#0A0A0A] rounded-bl-none'
            }`}>
              <AudioLines size={16} />
              <span className="text-xs font-bold">Voice message</span>
              <a href={m.mediaUrl} target="_blank" rel="noreferrer" className="opacity-80 hover:opacity-100"><Play size={14} /></a>
              <span className="text-[9px] opacity-70 ml-auto self-end shrink-0 flex items-center gap-1 font-bold">
                {m.sent === false && <Clock size={10} className="animate-pulse" />}
                <span>{formatMessageTime(m.scheduledAt || m.createdAt)}</span>
              </span>
            </div>
          )}
          {m.mediaUrl && m.mediaType === 'document' && (
            <div className={`mb-1 px-4 py-2.5 rounded-2xl border-2 border-[#0A0A0A] shadow-[2px_2px_0px_0px_#0A0A0A] flex items-center gap-2 ${
              isOwner ? 'bg-[#0A0A0A] text-[#F2EBDD] rounded-br-none' : 'bg-white text-[#0A0A0A] rounded-bl-none'
            }`}>
              <Paperclip size={14} />
              <a href={m.mediaUrl} target="_blank" rel="noreferrer" className="text-xs font-bold underline truncate max-w-[160px]">{cleanText.replace('📎 ', '')}</a>
              <span className="text-[9px] opacity-70 ml-auto self-end shrink-0 flex items-center gap-1 font-bold">
                {m.sent === false && <Clock size={10} className="animate-pulse" />}
                <span>{formatMessageTime(m.scheduledAt || m.createdAt)}</span>
              </span>
            </div>
          )}
          {cleanText && !(m.mediaUrl && (cleanText === '📷 Photo' || cleanText === '🎤 Voice message')) && m.mediaType !== 'document' && (
            <div className={`px-4 py-2.5 text-xs font-bold leading-relaxed border-2 border-[#0A0A0A] shadow-[2px_2px_0px_0px_#0A0A0A] whitespace-pre-wrap break-words flex flex-col ${
              isOwner ? 'bg-[#0A0A0A] text-[#F2EBDD] rounded-2xl rounded-br-none' : 'bg-white text-[#0A0A0A] rounded-2xl rounded-bl-none'
            } w-full`}>
              <span>{cleanText}</span>
              <span className="text-[9px] text-right mt-1 opacity-70 self-end shrink-0 flex items-center gap-1 font-bold">
                {m.sent === false && <Clock size={10} className="animate-pulse" />}
                <span>{formatMessageTime(m.scheduledAt || m.createdAt)}</span>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
