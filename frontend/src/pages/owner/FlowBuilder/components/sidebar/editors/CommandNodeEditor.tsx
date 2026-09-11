import React from 'react';
import type { CustomNodeData } from '../../../../../../types/bot';
import { t } from '../../../../../../i18n/config';

interface CommandNodeEditorProps {
  data: CustomNodeData;
  handleChange: (key: string, value: unknown) => void;
}

export const CommandNodeEditor: React.FC<CommandNodeEditorProps> = ({ data, handleChange }) => {
  const rawCommand = (data?.command as string) || '/start';
  const description = (data?.description as string) || '';

  const handleCommandChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.trim();
    if (val && !val.startsWith('/')) {
      val = '/' + val;
    }
    handleChange('command', val);
  };

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="commandInput" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          {t('editor.command.command_label')}
        </label>
        <div className="relative flex items-center">
          <input
            id="commandInput"
            type="text"
            value={rawCommand}
            onChange={handleCommandChange}
            placeholder="/command"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 text-sm font-bold transition-all bg-white font-mono text-slate-800"
          />
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5 font-medium leading-relaxed">
          {t('editor.command.command_hint')}
        </p>
      </div>

      <div>
        <label htmlFor="commandDescription" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          {t('editor.command.description_label')}
        </label>
        <textarea
          id="commandDescription"
          rows={3}
          value={description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder={t('editor.command.description_placeholder')}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 text-xs font-semibold transition-all resize-none bg-white text-slate-800"
        />
      </div>

      <div className="bg-teal-50/70 border border-teal-200/70 rounded-2xl p-3.5 text-xs text-teal-800 leading-relaxed font-semibold">
        <p>{t('editor.command.info_tip')}</p>
      </div>
    </div>
  );
};
