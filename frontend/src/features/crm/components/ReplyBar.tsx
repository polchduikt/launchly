import React from 'react';
import { t } from '../../../i18n';
import {
  Smile,
  ImageIcon,
  Paperclip,
  Mic,
  StopCircle,
  Loader2,
  X,
  RefreshCw,
  StickyNote,
} from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import type { BottomTab } from '../types/chat';

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
}) => {
  return (
    <div className="border-t border-slate-200 shrink-0 bg-white">
      <div className="flex border-b border-slate-100 px-4">
        <button onClick={() => onTabChange('reply')} className={`px-4 py-2 text-[13px] font-semibold cursor-pointer ${bottomTab === 'reply' ? 'text-slate-800 border-b-2 border-slate-800' : 'text-slate-400 hover:text-slate-600'}`}>{t('crm.reply.tab_reply')}</button>
        <button onClick={() => onTabChange('note')} className={`px-4 py-2 text-[13px] font-semibold cursor-pointer ${bottomTab === 'note' ? 'text-amber-600 border-b-2 border-amber-500' : 'text-slate-400 hover:text-slate-600'}`}>{t('crm.reply.tab_note')}</button>
      </div>
      {bottomTab === 'reply' ? (
        <>
          {pendingImage && (
            <div className="px-4 pt-3 flex items-center gap-2 bg-white">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                <img src={pendingImage.url} alt="Preview" className="w-full h-full object-cover" />
                <button onClick={onClearPendingImage} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow cursor-pointer"><X size={10} /></button>
              </div>
              <span className="text-[11px] text-slate-400">{t('crm.reply.image_attached')}</span>
            </div>
          )}
          {isRecording && (
            <div className="px-4 pt-3 flex items-center gap-2 text-red-500">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[12px] font-medium">{t('crm.reply.recording')}</span>
            </div>
          )}
          <div className="px-5 py-3.5 bg-white">
            <textarea
              value={typedMessage}
              onChange={e => onTypedMessageChange(e.target.value)}
              onKeyDown={onKeyPress}
              placeholder={t('crm.reply.placeholder_reply')}
              rows={2}
              className="w-full text-[13px] text-slate-700 placeholder:text-slate-400 resize-none focus:outline-none bg-transparent"
            />
          </div>
          <div className="px-5 py-2.5 border-t border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-1.5 relative">
              <div ref={emojiRef} className="relative">
                <button onClick={onToggleEmojiPicker} className="w-8 h-8 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer"><Smile size={18} /></button>
                {showEmojiPicker && (
                  <div className="absolute bottom-10 left-0 z-50 shadow-xl rounded-xl overflow-hidden">
                    <Picker data={data} onEmojiSelect={onEmojiSelect} theme="light" previewPosition="none" skinTonePosition="none" />
                  </div>
                )}
              </div>
              <button onClick={() => imageInputRef.current?.click()} className={`w-8 h-8 flex items-center justify-center rounded-md hover:bg-slate-50 cursor-pointer ${isImageUploading ? 'text-indigo-500' : 'text-slate-400 hover:text-slate-600'}`}>
                {isImageUploading ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
              </button>
              <input ref={imageInputRef} type="file" accept="image/*" onChange={onImageSelect} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className={`w-8 h-8 flex items-center justify-center rounded-md hover:bg-slate-50 cursor-pointer ${isFileUploading ? 'text-indigo-500' : 'text-slate-400 hover:text-slate-600'}`}>
                {isFileUploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
              </button>
              <input ref={fileInputRef} type="file" accept="*/*" onChange={onFileSelect} className="hidden" />
              <button
                onClick={onMicClick}
                className={`w-8 h-8 flex items-center justify-center rounded-md cursor-pointer transition-all ${isRecording ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
              >
                {isRecording ? <StopCircle size={18} /> : <Mic size={18} />}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onSend} disabled={(!typedMessage.trim() && !pendingImage) || isSending} className="flex items-center gap-2 px-5 py-2.5 bg-[#0088cc] hover:bg-[#007bb8] disabled:opacity-50 text-white text-[12px] font-bold rounded-lg cursor-pointer shadow-sm">
                {isSending ? <Loader2 className="animate-spin" size={14} /> : <>{t('crm.reply.btn_send')}</>}
              </button>
              <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 cursor-pointer"><RefreshCw size={14} /></button>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-amber-50/60 border-t-0">
          <div className="px-5 pt-4 pb-2">
            <textarea
              value={typedNote}
              onChange={e => onTypedNoteChange(e.target.value)}
              placeholder={t('crm.reply.placeholder_note')}
              rows={3}
              className="w-full text-[13px] text-slate-700 placeholder:text-amber-400/80 resize-none focus:outline-none bg-transparent"
            />
          </div>
          <div className="px-5 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button className="w-8 h-8 flex items-center justify-center rounded-md text-amber-400 hover:text-amber-600 hover:bg-amber-100 cursor-pointer">
                <Smile size={18} />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-md text-amber-400 hover:text-amber-600 hover:bg-amber-100 cursor-pointer">
                <ImageIcon size={18} />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-md text-amber-400 hover:text-amber-600 hover:bg-amber-100 cursor-pointer">
                <Paperclip size={18} />
              </button>
              <div className="w-px h-5 bg-amber-200 mx-1" />
              <button className="w-8 h-8 flex items-center justify-center rounded-md text-amber-400 hover:text-amber-600 hover:bg-amber-100 cursor-pointer">
                <StickyNote size={18} />
              </button>
            </div>
            <button
              onClick={onSaveNote}
              disabled={!typedNote.trim()}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-500 disabled:opacity-40 text-white text-[12px] font-bold rounded-lg cursor-pointer shadow-sm transition-all"
            >
              {t('crm.reply.btn_add_note')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
