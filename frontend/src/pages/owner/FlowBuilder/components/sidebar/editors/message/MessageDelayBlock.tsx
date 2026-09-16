import React from 'react';
import type { FlowBlock } from '../../../../../../../types/bot';
import { t } from '../../../../../../../i18n/config';
import { FLOW_DEFAULTS } from '../../../../../../../const/constants';

export interface MessageDelayBlockProps {
  block: FlowBlock;
  onUpdateDelay: (seconds: number) => void;
}

export const MessageDelayBlock: React.FC<MessageDelayBlockProps> = ({
  block,
  onUpdateDelay,
}) => {
  return (
    <div className="p-4 flex items-center justify-between gap-4">
      <span className="text-xs text-slate-600 font-semibold">
        {t('editor.message.delay_duration')}
      </span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          max={60}
          value={block.delaySeconds || FLOW_DEFAULTS.DELAY_SECONDS}
          onChange={(e) =>
            onUpdateDelay(Math.max(1, parseInt(e.target.value) || FLOW_DEFAULTS.DELAY_SECONDS))
          }
          className="w-16 px-2.5 py-1.5 border border-slate-205 rounded-xl text-xs font-bold text-center bg-slate-50/50 focus:outline-none focus:border-indigo-500"
        />
        <span className="text-xs text-slate-500 font-bold">
          {t('editor.message.seconds')}
        </span>
      </div>
    </div>
  );
};
