import React from 'react';
import type { CooldownNodeEditorProps } from '../../../../../../types/bot';
import { CustomSelect } from '../../../../../../components/ui/CustomSelect';
import { t } from '../../../../../../i18n/config';

interface EditorStateLocal {
  setIsNextStepDrawerOpen: (open: boolean) => void;
  setNextStepSourceHandle: (handle: string | null) => void;
}

export const CooldownNodeEditor: React.FC<CooldownNodeEditorProps> = ({
  data,
  handleChange,
  editorState,
}) => {
  const duration = (data?.duration as number | string | undefined) ?? 1;
  const unit = (data?.unit as string) || 'MINUTES';
  const blockMessage = (data?.blockMessage as string) !== undefined
    ? (data?.blockMessage as string)
    : 'Зачекайте ще {remaining} перед повторною спробою!';

  const unitOptions = [
    { value: 'SECONDS', label: t('editor.cooldown.unit_seconds', 'Секунди') },
    { value: 'MINUTES', label: t('editor.cooldown.unit_minutes', 'Хвилини') },
    { value: 'HOURS', label: t('editor.cooldown.unit_hours', 'Години') },
    { value: 'DAYS', label: t('editor.cooldown.unit_days', 'Дні') },
  ];

  return (
    <div className="space-y-4 font-['JetBrains_Mono',monospace]">
      <div>
        <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider mb-1.5">
          {t('editor.cooldown.duration_label', 'Час очікування')}
        </label>
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <input
              type="number"
              min="0"
              value={duration}
              onChange={(e) => handleChange('duration', e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-black text-[#0A0A0A] focus:outline-none"
            />
          </div>
          <div className="w-32">
            <CustomSelect
              value={unit}
              onChange={(val) => handleChange('unit', val)}
              options={unitOptions}
              buttonClassName="w-full px-3 py-2 rounded-xl border-2 border-[#0A0A0A] text-xs font-black text-[#0A0A0A] bg-white flex items-center justify-between transition-all cursor-pointer hover:bg-[#F2EBDD]/30"
            />
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider">
            {t('editor.cooldown.message_label', 'Повідомлення при блокуванні')}
          </label>
        </div>

        <textarea
          rows={3}
          value={blockMessage}
          onChange={(e) => handleChange('blockMessage', e.target.value)}
          placeholder={t('editor.cooldown.message_placeholder', 'Зачекайте ще {remaining} перед повторною спробою!')}
          className="w-full px-3 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] placeholder:text-[#0A0A0A]/40 focus:outline-none resize-none"
        />
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={() => {
            if (editorState) {
              (editorState as EditorStateLocal).setNextStepSourceHandle('next');
              (editorState as EditorStateLocal).setIsNextStepDrawerOpen(true);
            }
          }}
          className="w-full py-2.5 bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] text-[#0A0A0A] border-2 border-[#0A0A0A] text-xs font-black uppercase rounded-xl transition-all cursor-pointer text-center select-none shadow-[2px_2px_0px_0px_#0A0A0A] hover:shadow-none"
        >
          {t('editor.cooldown.choose_next_step', 'Обрати наступний крок')}
        </button>
      </div>
    </div>
  );
};
