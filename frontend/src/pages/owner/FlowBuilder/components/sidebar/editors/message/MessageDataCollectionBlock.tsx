import React from 'react';
import { Database } from 'lucide-react';
import type { FlowBlock } from '../../../../../../../types/bot';
import { t } from '../../../../../../../i18n/config';

export interface MessageDataCollectionBlockProps {
  block: FlowBlock;
  onUpdateText: (text: string) => void;
  onOpenEditDataCollection?: (block: FlowBlock) => void;
}

export const MessageDataCollectionBlock: React.FC<MessageDataCollectionBlockProps> = ({
  block,
  onUpdateText,
  onOpenEditDataCollection,
}) => {
  return (
    <div className="p-4 space-y-3">
      <div>
        <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
          {t('editor.message.question_to_ask')}
        </label>
        <textarea
          value={block.text || ''}
          onChange={(e) => onUpdateText(e.target.value)}
          placeholder={t('editor.message.question_placeholder')}
          rows={2}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-semibold bg-slate-50/20 resize-none"
        />
      </div>

      <div className="pt-1.5 flex flex-col items-center select-none nodrag">
        <button
          type="button"
          onClick={() => {
            if (onOpenEditDataCollection) {
              onOpenEditDataCollection(block);
            }
          }}
          className="px-4 py-2 bg-indigo-50/30 hover:bg-indigo-50 border border-dashed border-indigo-400 text-indigo-700 text-[11px] font-extrabold rounded-2xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
        >
          <Database size={12} />
          <span>
            {t('editor.message.contact_reply', {
              type: typeof block.replyType === 'string' ? block.replyType : 'Text',
            })}
          </span>
        </button>
        <span className="text-[9px] font-semibold text-slate-400 mt-2 block text-center leading-normal">
          {t('editor.message.reply_note')}
        </span>
      </div>
    </div>
  );
};
