import React from 'react';
import { useTranslation } from '../../../../i18n/config';

interface TelegramPreviewModalProps {
  isPreviewOpen: boolean;
  setIsPreviewOpen: (open: boolean) => void;
  messageText: string;
}

export const TelegramPreviewModal: React.FC<TelegramPreviewModalProps> = ({
  isPreviewOpen,
  setIsPreviewOpen,
  messageText,
}) => {
  const { t } = useTranslation();
  if (!isPreviewOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="bg-slate-900 rounded-[3rem] border-8 border-slate-800 shadow-2xl max-w-sm w-full h-[600px] flex flex-col overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-5 rounded-full bg-slate-800 flex items-center justify-center gap-1 z-20">
          <span className="w-8 h-1 bg-slate-700 rounded-full" />
          <span className="w-2.5 h-2.5 bg-slate-900 rounded-full border border-slate-700" />
        </div>

        <div className="bg-slate-800 px-6 pt-8 pb-3 flex items-center justify-between text-white border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold font-sans">
              L
            </span>
            <div>
              <div className="text-xs font-bold">Launchly Bot</div>
              <div className="text-[9px] text-slate-400 font-semibold">bot</div>
            </div>
          </div>
          <button
            onClick={() => setIsPreviewOpen(false)}
            className="text-slate-400 hover:text-white p-1 hover:bg-slate-700 rounded-xl transition-all cursor-pointer text-xs font-semibold"
          >
            {t('broadcast.builder.close_preview')}
          </button>
        </div>

        <div className="flex-1 p-4 bg-slate-955 flex flex-col justify-end space-y-4 overflow-y-auto">
          <div className="flex flex-col space-y-1 max-w-[85%] self-start animate-in slide-in-from-bottom-2 duration-150">
            <div className="bg-slate-800 text-white rounded-2xl rounded-tl-none py-2 px-3.5 text-xs leading-relaxed font-sans shadow-sm whitespace-pre-wrap">
              {messageText || t('broadcast.dialog.message_placeholder')}
            </div>
            <span className="text-[8px] text-slate-500 font-bold self-end pr-1">12:00 PM</span>
          </div>
        </div>

        <div className="bg-slate-800 p-3 flex items-center gap-2 border-t border-slate-700 shrink-0">
          <input
            type="text"
            disabled
            placeholder="Message"
            className="flex-1 bg-slate-900/60 border border-slate-700 rounded-full py-1.5 px-4 text-xs text-slate-400 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};
