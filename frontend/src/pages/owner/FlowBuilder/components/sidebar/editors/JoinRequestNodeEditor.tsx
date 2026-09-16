import React from 'react';
import type { CustomNodeData } from '../../../../../../types/bot';
import { t } from '../../../../../../i18n/config';

interface JoinRequestNodeEditorProps {
  data: CustomNodeData;
  handleChange: (key: string, value: unknown) => void;
}

export const JoinRequestNodeEditor: React.FC<JoinRequestNodeEditorProps> = ({ data, handleChange }) => {
  const autoApprove = data?.autoApprove !== false;
  const channelId = (data?.channelId as string) || '';

  return (
    <div className="space-y-4 font-['JetBrains_Mono',monospace]">
      <div className="space-y-1.5">
        <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider">
          {t('editor.join_request.auto_approve_title', 'Автоматичне схвалення')}
        </label>
        <div className="grid grid-cols-2 gap-1.5 bg-white border-2 border-[#0A0A0A] p-1.5 rounded-2xl select-none shadow-xs">
          <button
            type="button"
            onClick={() => handleChange('autoApprove', true)}
            className={`py-2 text-xs font-black uppercase rounded-xl transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 ${
              autoApprove
                ? 'bg-[#0A0A0A] text-[#FAF7EE] shadow-sm'
                : 'bg-transparent text-[#0A0A0A]/60 hover:text-[#0A0A0A] hover:bg-black/5'
            }`}
          >
            <span>{t('common.enabled', 'Увімкнено')}</span>
          </button>
          <button
            type="button"
            onClick={() => handleChange('autoApprove', false)}
            className={`py-2 text-xs font-black uppercase rounded-xl transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 ${
              !autoApprove
                ? 'bg-[#0A0A0A] text-[#FAF7EE] shadow-sm'
                : 'bg-transparent text-[#0A0A0A]/60 hover:text-[#0A0A0A] hover:bg-black/5'
            }`}
          >
            <span>{t('common.disabled', 'Вимкнено')}</span>
          </button>
        </div>
        <p className="text-[11px] text-[#0A0A0A]/60 font-bold leading-relaxed">
          {t('editor.join_request.auto_approve_hint', 'Бот миттєво схвалюватиме вхід користувача в канал чи групу')}
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider">
          {t('editor.join_request.channel_filter_title', 'Фільтр каналу (опціонально)')}
        </label>
        <input
          type="text"
          value={channelId}
          onChange={(e) => handleChange('channelId', e.target.value)}
          placeholder={t('editor.join_request.channel_placeholder', '-1001234567890 або @channel_name')}
          className="w-full px-3 py-2 text-xs font-bold bg-white border-2 border-[#0A0A0A] rounded-xl focus:outline-none placeholder:text-[#0A0A0A]/40 shadow-xs"
        />
        <p className="text-[11px] text-[#0A0A0A]/60 font-bold leading-relaxed">
          {t('editor.join_request.channel_filter_hint', 'Залиште пустим, щоб тригер спрацьовував для будь-якого підключеного каналу')}
        </p>
      </div>
    </div>
  );
};