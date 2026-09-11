import React from 'react';
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react';
import type { LeaderboardNodeEditorProps } from '../../../../../../types/bot';
import { CustomFieldPicker } from './CustomFieldPicker';
import { t } from '../../../../../../i18n/config';

interface EditorStateLocal {
  setIsNextStepDrawerOpen: (open: boolean) => void;
  setNextStepSourceHandle: (handle: string | null) => void;
}

export const LeaderboardNodeEditor: React.FC<LeaderboardNodeEditorProps> = ({
  data,
  handleChange,
  editorState,
}) => {
  const targetField = (data?.targetField as string) || '';
  const limit = (data?.limit as number | string | undefined) ?? 10;
  const showRank = data?.showRank !== undefined ? Boolean(data.showRank) : true;
  const showScores = data?.showScores !== undefined ? Boolean(data.showScores) : true;
  const sortOrder = (data?.sortOrder as string) || 'DESC';
  const customHeader = (data?.customHeader as string) || '';

  return (
    <div className="space-y-4 font-['JetBrains_Mono',monospace]">
      <div>
        <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider mb-1.5">
          {t('node.leaderboard.target_field', 'Поле для рейтингу')}
        </label>
        <CustomFieldPicker
          value={targetField}
          onChange={(newFieldName) => handleChange('targetField', newFieldName)}
          placeholder={t('node.leaderboard.target_field_placeholder', 'Оберіть числове поле для рейтингу')}
        />
      </div>

      <div>
        <label htmlFor="limit" className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider mb-1.5">
          {t('node.leaderboard.limit_label', 'Кількість учасників у списку')}
        </label>
        <div className="relative">
          <input
            id="limit"
            type="number"
            min="0"
            max="100"
            value={limit}
            onChange={(e) => handleChange('limit', e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full px-3 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-black text-[#0A0A0A] focus:outline-none"
          />
        </div>
      </div>

      <div className="space-y-2.5 p-3 bg-white border-2 border-[#0A0A0A] rounded-xl">
        <label className="flex items-center justify-between cursor-pointer select-none">
          <span className="text-xs font-bold text-[#0A0A0A]">
            {t('node.leaderboard.show_rank', 'Додати нумерацію')}
          </span>
          <input
            type="checkbox"
            checked={showRank}
            onChange={(e) => handleChange('showRank', e.target.checked)}
            className="w-4 h-4 accent-[#0A0A0A] cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer select-none pt-2 border-t border-slate-200">
          <span className="text-xs font-bold text-[#0A0A0A]">
            {t('node.leaderboard.show_scores', 'Додати кількість балів')}
          </span>
          <input
            type="checkbox"
            checked={showScores}
            onChange={(e) => handleChange('showScores', e.target.checked)}
            className="w-4 h-4 accent-[#0A0A0A] cursor-pointer"
          />
        </label>
      </div>

      <div>
        <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider mb-1.5">
          {t('node.leaderboard.sort_order', 'Порядок сортування')}
        </label>
        <div className="grid grid-cols-2 gap-1.5 bg-white border-2 border-[#0A0A0A] p-1 rounded-xl select-none">
          <button
            type="button"
            onClick={() => handleChange('sortOrder', 'DESC')}
            className={`min-w-0 px-2 py-1.5 text-xs font-black uppercase rounded-lg transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 ${
              sortOrder === 'DESC'
                ? 'bg-[#0A0A0A] text-[#F2EBDD]'
                : 'text-[#0A0A0A] hover:bg-[#F2EBDD] bg-transparent'
            }`}
          >
            <ArrowDownWideNarrow size={13} className="shrink-0" />
            <span className="truncate">{t('node.leaderboard.sort_desc', 'За спаданням')}</span>
          </button>
          <button
            type="button"
            onClick={() => handleChange('sortOrder', 'ASC')}
            className={`min-w-0 px-2 py-1.5 text-xs font-black uppercase rounded-lg transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 ${
              sortOrder === 'ASC'
                ? 'bg-[#0A0A0A] text-[#F2EBDD]'
                : 'text-[#0A0A0A] hover:bg-[#F2EBDD] bg-transparent'
            }`}
          >
            <ArrowUpNarrowWide size={13} className="shrink-0" />
            <span className="truncate">{t('node.leaderboard.sort_asc', 'За зростанням')}</span>
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="customHeader" className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider mb-1.5">
          {t('node.leaderboard.custom_header', 'Кастомний заголовок списку')}
        </label>
        <div className="relative">
          <input
            id="customHeader"
            type="text"
            value={customHeader}
            onChange={(e) => handleChange('customHeader', e.target.value)}
            placeholder="🏆 Рейтинг гравців:"
            className="w-full px-3 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] placeholder:text-[#0A0A0A]/40 focus:outline-none"
          />
        </div>
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
          {t('editor.smart_delay.choose_next_step', 'Обрати наступний крок')}
        </button>
      </div>
    </div>
  );
};