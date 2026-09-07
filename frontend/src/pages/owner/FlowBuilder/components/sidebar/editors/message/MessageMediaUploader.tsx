import React from 'react';
import { Trash2, Loader2, Image as ImageIcon, Volume2, Video, Paperclip } from 'lucide-react';
import { t } from '../../../../../../../i18n/config';

interface MessageMediaUploaderProps {
  type: 'image' | 'audio' | 'video' | 'file';
  url?: string;
  fileName?: string;
  isUploading: boolean;
  onUploadClick: () => void;
  onUrlChange: (newUrl: string) => void;
  onDeleteMedia: () => void;
}

export const MessageMediaUploader: React.FC<MessageMediaUploaderProps> = ({
  type,
  url,
  fileName,
  isUploading,
  onUploadClick,
  onUrlChange,
  onDeleteMedia,
}) => {
  const renderPreview = () => {
    switch (type) {
      case 'image':
        return (
          <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
            <img src={url} alt="Media" className="w-full h-32 object-cover" />
            <button
              type="button"
              onClick={onDeleteMedia}
              className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white text-rose-600 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Trash2 size={13} />
            </button>
          </div>
        );
      case 'audio':
        return (
          <div className="space-y-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Audio Preview</span>
              <button
                type="button"
                onClick={onDeleteMedia}
                className="p-1.5 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-xl transition-all cursor-pointer shadow-sm border border-slate-100"
              >
                <Trash2 size={13} />
              </button>
            </div>
            <audio controls className="w-full h-8" src={url} />
          </div>
        );
      case 'video':
        return (
          <div className="space-y-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Video Preview</span>
              <button
                type="button"
                onClick={onDeleteMedia}
                className="p-1.5 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-xl transition-all cursor-pointer shadow-sm border border-slate-100"
              >
                <Trash2 size={13} />
              </button>
            </div>
            <video controls className="w-full max-h-40 rounded-xl bg-black" src={url} />
          </div>
        );
      case 'file':
        return (
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 overflow-hidden">
              <Paperclip size={14} className="text-amber-500 shrink-0" />
              <span className="text-xs font-bold text-slate-700 truncate">
                {fileName || 'Document'}
              </span>
            </div>
            <button
              type="button"
              onClick={onDeleteMedia}
              className="p-1.5 bg-white hover:bg-rose-50 text-rose-600 rounded-xl shadow-xs cursor-pointer border border-slate-100"
            >
              <Trash2 size={13} />
            </button>
          </div>
        );
    }
  };

  const getUploadIcon = () => {
    switch (type) {
      case 'image':
        return <ImageIcon size={13} className="text-emerald-500" />;
      case 'audio':
        return <Volume2 size={13} className="text-violet-500" />;
      case 'video':
        return <Video size={13} className="text-rose-500" />;
      case 'file':
        return <Paperclip size={13} className="text-amber-500" />;
    }
  };

  const getPlaceholder = () => {
    switch (type) {
      case 'image':
        return t('editor.message.paste_image_url');
      case 'audio':
        return t('editor.message.paste_audio_url');
      case 'video':
        return t('editor.message.paste_video_url');
      case 'file':
        return t('editor.message.paste_file_url');
    }
  };

  if (url) {
    return renderPreview();
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onUploadClick}
          disabled={isUploading}
          className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
        >
          {isUploading ? (
            <Loader2 size={13} className="animate-spin text-slate-400" />
          ) : (
            getUploadIcon()
          )}
          <span>{t('editor.message.upload_file')}</span>
        </button>
      </div>
      <input
        type="text"
        placeholder={getPlaceholder()}
        value={url || ''}
        onChange={(e) => onUrlChange(e.target.value)}
        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-semibold bg-slate-50/20"
      />
    </div>
  );
};
