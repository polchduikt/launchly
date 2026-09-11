import React from 'react';
import { Sparkles, Hash, Plus, Minus, Equal, X, Divide } from 'lucide-react';
import type { MathNodeEditorProps } from '../../../../../../types/bot';
import { CustomFieldPicker } from './CustomFieldPicker';
import { t } from '../../../../../../i18n/config';

interface EditorStateLocal {
  setIsNextStepDrawerOpen: (open: boolean) => void;
  setNextStepSourceHandle: (handle: string | null) => void;
}

export const MathNodeEditor: React.FC<MathNodeEditorProps> = ({
  data,
  handleChange,
  editorState,
}) => {
  const targetField = (data?.targetField as string) || '';
  const valueField = (data?.valueField as string) || '';
  const operationMode = (data?.operationMode as string) || 'RANDOM';
  const operationType = (data?.operationType as string) || 'ADD';
  const staticValue = (data?.staticValue as number | string | undefined) ?? 1;
  const randomMin = (data?.randomMin as number | string | undefined) ?? 1;
  const randomMax = (data?.randomMax as number | string | undefined) ?? 10;
  const randomStep = (data?.randomStep as number | string | undefined) ?? 1;

  const opButtons = [
    { type: 'ADD', title: t('node.math.op_add', 'Додати'), icon: Plus },
    { type: 'SUBTRACT', title: t('node.math.op_subtract', 'Відняти'), icon: Minus },
    { type: 'SET', title: t('node.math.op_set', 'Встановити'), icon: Equal },
    { type: 'MULTIPLY', title: t('node.math.op_multiply', 'Помножити'), icon: X },
    { type: 'DIVIDE', title: t('node.math.op_divide', 'Поділити'), icon: Divide },
  ];

  return (
    <div className="space-y-4 font-['JetBrains_Mono',monospace]">
      <div>
        <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider mb-1.5">
          {t('node.math.target_field', 'Поле для суми')}
        </label>
        <CustomFieldPicker
          value={targetField}
          onChange={(newFieldName) => handleChange('targetField', newFieldName)}
          placeholder={t('node.math.target_field_placeholder', 'Оберіть поле (напр. iq, balance)')}
        />
      </div>

      <div>
        <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider mb-1.5">
          {t('node.math.value_field', 'Поле для нарахованого значення')}
        </label>
        <CustomFieldPicker
          value={valueField}
          onChange={(newFieldName) => handleChange('valueField', newFieldName)}
          placeholder={t('node.math.value_field_placeholder', 'Оберіть поле для дельти (напр. avg)')}
        />
      </div>

      <div>
        <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider mb-1.5">
          {t('node.math.operation_type', 'Тип операції')}
        </label>
        <div className="grid grid-cols-5 gap-1.5 bg-white border-2 border-[#0A0A0A] p-1 rounded-xl select-none">
          {opButtons.map((btn) => {
            const Icon = btn.icon;
            const isSelected = operationType === btn.type;
            return (
              <button
                key={btn.type}
                type="button"
                onClick={() => handleChange('operationType', btn.type)}
                title={btn.title}
                className={`py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer border-none flex items-center justify-center ${
                  isSelected
                    ? 'bg-[#0A0A0A] text-[#F2EBDD]'
                    : 'text-[#0A0A0A] hover:bg-[#F2EBDD] bg-transparent'
                }`}
              >
                <Icon size={15} strokeWidth={3} />
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider mb-1.5">
          {t('node.math.value_mode', 'Режим значення')}
        </label>
        <div className="grid grid-cols-2 gap-1.5 bg-white border-2 border-[#0A0A0A] p-1 rounded-xl select-none mb-3">
          <button
            type="button"
            onClick={() => handleChange('operationMode', 'RANDOM')}
            className={`py-1.5 text-xs font-black uppercase rounded-lg transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 ${
              operationMode === 'RANDOM'
                ? 'bg-[#0A0A0A] text-[#F2EBDD]'
                : 'text-[#0A0A0A] hover:bg-[#F2EBDD] bg-transparent'
            }`}
          >
            <Sparkles size={12} />
            {t('node.math.mode_random', 'Рандом')}
          </button>
          <button
            type="button"
            onClick={() => handleChange('operationMode', 'STATIC')}
            className={`py-1.5 text-xs font-black uppercase rounded-lg transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 ${
              operationMode === 'STATIC'
                ? 'bg-[#0A0A0A] text-[#F2EBDD]'
                : 'text-[#0A0A0A] hover:bg-[#F2EBDD] bg-transparent'
            }`}
          >
            <Hash size={12} />
            {t('node.math.mode_static', 'Фіксоване')}
          </button>
        </div>

        {operationMode === 'RANDOM' ? (
          <div className="space-y-3 p-3 bg-white border-2 border-[#0A0A0A] rounded-xl">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="randomMin" className="block text-[10px] font-black text-[#0A0A0A] uppercase mb-1">
                  {t('node.math.min', 'Мін. (від)')}
                </label>
                <input
                  id="randomMin"
                  type="number"
                  value={randomMin}
                  onChange={(e) => handleChange('randomMin', e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-[#F2EBDD]/30 border-2 border-[#0A0A0A] rounded-lg text-xs font-black text-[#0A0A0A] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="randomMax" className="block text-[10px] font-black text-[#0A0A0A] uppercase mb-1">
                  {t('node.math.max', 'Макс. (до)')}
                </label>
                <input
                  id="randomMax"
                  type="number"
                  value={randomMax}
                  onChange={(e) => handleChange('randomMax', e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-[#F2EBDD]/30 border-2 border-[#0A0A0A] rounded-lg text-xs font-black text-[#0A0A0A] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="randomStep" className="block text-[10px] font-black text-[#0A0A0A] uppercase mb-1">
                {t('node.math.step', 'Крок (Step)')}
              </label>
              <input
                id="randomStep"
                type="number"
                min="0"
                value={randomStep}
                onChange={(e) => handleChange('randomStep', e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-[#F2EBDD]/30 border-2 border-[#0A0A0A] rounded-lg text-xs font-black text-[#0A0A0A] focus:outline-none"
              />
            </div>
          </div>
        ) : (
          <div className="p-3 bg-white border-2 border-[#0A0A0A] rounded-xl">
            <div>
              <label htmlFor="staticValue" className="block text-[10px] font-black text-[#0A0A0A] uppercase mb-1">
                {t('node.math.value', 'Значення')}
              </label>
              <input
                id="staticValue"
                type="number"
                value={staticValue}
                onChange={(e) => handleChange('staticValue', e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-[#F2EBDD]/30 border-2 border-[#0A0A0A] rounded-lg text-xs font-black text-[#0A0A0A] focus:outline-none"
              />
            </div>
          </div>
        )}
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