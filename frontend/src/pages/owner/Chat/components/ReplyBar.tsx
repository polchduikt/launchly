import React, { useRef, useEffect } from 'react';
import { t } from '../../../../i18n/config';
import {
  Smile,
  ImageIcon,
  Paperclip,
  Mic,
  StopCircle,
  Loader2,
  X,
  RefreshCw,
} from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import type { BottomTab } from '../../../../types/chat';

interface ReplyBarProps {
  bottomTab: BottomTab;
  onTabChange: (tab: BottomTab) => void;
  typedMessage: string;
  onTypedMessageChange: (msg: string) => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  isSending: boolean;
  pendingImage: { url: string; file: File } | null;
  onClearPendingImage: () => void;
  isRecording: boolean;
  onMicClick: () => void;
  showEmojiPicker: boolean;
  onToggleEmojiPicker: () => void;
  onEmojiSelect: (emoji: { native: string }) => void;
  emojiRef: React.RefObject<HTMLDivElement | null>;
  imageInputRef: React.RefObject<HTMLInputElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isImageUploading: boolean;
  isFileUploading: boolean;
  typedNote: string;
  onTypedNoteChange: (note: string) => void;
  onSaveNote: () => void;
  onScheduleClick: () => void;
}

export const ReplyBar: React.FC<ReplyBarProps> = ({
  bottomTab,
  onTabChange,
  typedMessage,
  onTypedMessageChange,
  onKeyPress,
  onSend,
  isSending,
  pendingImage,
  onClearPendingImage,
  isRecording,
  onMicClick,
  showEmojiPicker,
  onToggleEmojiPicker,
  onEmojiSelect,
  emojiRef,
  imageInputRef,
  fileInputRef,
  onImageSelect,
  onFileSelect,
  isImageUploading,
  isFileUploading,
  typedNote,
  onTypedNoteChange,
  onSaveNote,
  onScheduleClick,
}) => {
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-expand reply textarea
  useEffect(() => {
    const el = replyTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const newHeight = Math.min(el.scrollHeight, 160);
    el.style.height = newHeight + 'px';
    el.style.overflowY = newHeight >= 160 ? 'auto' : 'hidden';
  }, [typedMessage]);

  // Auto-expand note textarea
  useEffect(() => {
    const el = noteTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const newHeight = Math.min(el.scrollHeight, 160);
    el.style.height = newHeight + 'px';
    el.style.overflowY = newHeight >= 160 ? 'auto' : 'hidden';
  }, [typedNote]);

  return (
    <div className="border-t-2 border-[#0A0A0A] shrink-0 bg-[#F2EBDD] font-['JetBrains_Mono',monospace]">
      <div className="flex border-b-2 border-[#0A0A0A] px-4 pt-2 gap-2">
        <button
          onClick={() => onTabChange('reply')}
          className={`px-4 py-1.5 text-xs font-black uppercase rounded-t-xl transition-all cursor-pointer ${
            bottomTab === 'reply'
              ? 'bg-[#0A0A0A] text-[#F2EBDD] border-2 border-[#0A0A0A] border-b-0'
              : 'text-[#0A0A0A] hover:bg-white border-2 border-transparent'
          }`}
        >
          {t('crm.reply.tab_reply')}
        </button>
        <button
          onClick={() => onTabChange('note')}
          className={`px-4 py-1.5 text-xs font-black uppercase rounded-t-xl transition-all cursor-pointer ${
            bottomTab === 'note'
              ? 'bg-amber-400 text-[#0A0A0A] border-2 border-[#0A0A0A] border-b-0'
              : 'text-[#0A0A0A] hover:bg-white border-2 border-transparent'
          }`}
        >
          {t('crm.reply.tab_note')}
        </button>
      </div>
      {bottomTab === 'reply' ? (
        <>
          {pendingImage && (
            <div className="px-4 pt-3 flex items-center gap-2 bg-[#F2EBDD]">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-[#0A0A0A] shadow-[2px_2px_0px_0px_#0A0A0A]">
                <img src={pendingImage.url} alt="Preview" className="w-full h-full object-cover" />
                <button onClick={onClearPendingImage} className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white border border-[#0A0A0A] rounded-full flex items-center justify-center cursor-pointer"><X size={10} /></button>
              </div>
              <span className="text-xs font-bold text-[#0A0A0A]">{t('crm.reply.image_attached')}</span>
            </div>
          )}
          {isRecording && (
            <div className="px-4 pt-3 flex items-center gap-2 text-rose-600 font-bold">
              <span className="w-2.5 h-2.5 bg-rose-600 rounded-full animate-pulse border border-[#0A0A0A]" />
              <span className="text-xs uppercase">{t('crm.reply.recording')}</span>
            </div>
          )}
          <div className="px-5 py-3">
            <textarea
              ref={replyTextareaRef}
              value={typedMessage}
              onChange={e => onTypedMessageChange(e.target.value)}
              onKeyDown={onKeyPress}
              placeholder={t('crm.reply.placeholder_reply')}
              rows={1}
              style={{ minHeight: '40px', maxHeight: '160px' }}
              className="w-full text-xs font-bold text-[#0A0A0A] placeholder:text-slate-500 bg-white border-2 border-[#0A0A0A] rounded-xl p-3 focus:outline-none resize-none leading-relaxed"
            />
          </div>
          <div className="px-5 py-2.5 border-t-2 border-[#0A0A0A] flex items-center justify-between bg-[#F2EBDD]">
            <div className="flex items-center gap-1.5 relative">
              <div ref={emojiRef} className="relative">
                <button onClick={onToggleEmojiPicker} className="w-8 h-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] cursor-pointer transition-all"><Smile size={16} /></button>
                {showEmojiPicker && (
                  <div className="absolute bottom-10 left-0 z-50 shadow-[8px_8px_0px_0px_#0A0A0A] border-2 border-[#0A0A0A] rounded-2xl overflow-hidden">
                    <Picker data={data} onEmojiSelect={onEmojiSelect} theme="light" previewPosition="none" skinTonePosition="none" />
                  </div>
                )}
              </div>
              <button onClick={() => imageInputRef.current?.click()} className={`w-8 h-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] cursor-pointer transition-all ${isImageUploading ? 'animate-pulse' : ''}`}>
                {isImageUploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
              </button>
              <input ref={imageInputRef} type="file" accept="image/*" onChange={onImageSelect} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className={`w-8 h-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] cursor-pointer transition-all ${isFileUploading ? 'animate-pulse' : ''}`}>
                {isFileUploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
              </button>
              <input ref={fileInputRef} type="file" accept="*/*" onChange={onFileSelect} className="hidden" />
              <button
                onClick={onMicClick}
                className={`w-8 h-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] cursor-pointer transition-all ${isRecording ? 'bg-rose-600 text-white' : 'bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD]'}`}
              >
                {isRecording ? <StopCircle size={16} /> : <Mic size={16} />}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onSend} disabled={(!typedMessage.trim() && !pendingImage) || isSending} className="flex items-center gap-2 px-5 py-2 bg-[#0A0A0A] hover:bg-[#2A2A2A] disabled:opacity-50 text-[#F2EBDD] text-xs font-black uppercase rounded-xl border-2 border-[#0A0A0A] cursor-pointer transition-all">
                {isSending ? <Loader2 className="animate-spin" size={14} /> : <>{t('crm.reply.btn_send')}</>}
              </button>
              <button onClick={onScheduleClick} disabled={(!typedMessage.trim() && !pendingImage) || isSending} className="w-8 h-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"><RefreshCw size={14} /></button>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-amber-100/60 border-t-0">
          <div className="px-5 py-3">
            <textarea
              ref={noteTextareaRef}
              value={typedNote}
              onChange={e => onTypedNoteChange(e.target.value)}
              placeholder={t('crm.reply.placeholder_note')}
              rows={1}
              style={{ minHeight: '40px', maxHeight: '160px' }}
              className="w-full text-xs font-bold text-[#0A0A0A] placeholder:text-amber-800/60 bg-white border-2 border-[#0A0A0A] rounded-xl p-3 focus:outline-none resize-none leading-relaxed"
            />
          </div>
          <div className="px-5 py-2.5 border-t-2 border-[#0A0A0A] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button className="w-8 h-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] cursor-pointer">
                <Smile size={16} />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] cursor-pointer">
                <ImageIcon size={16} />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] cursor-pointer">
                <Paperclip size={16} />
              </button>
            </div>
            <button
              onClick={onSaveNote}
              disabled={!typedNote.trim()}
              className="px-5 py-2 bg-amber-400 hover:bg-amber-500 disabled:opacity-40 text-[#0A0A0A] border-2 border-[#0A0A0A] text-xs font-black uppercase rounded-xl cursor-pointer transition-all"
            >
              {t('crm.reply.btn_add_note')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
