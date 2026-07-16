import React from 'react';
import { t } from '../../../../../i18n';

export const EndNodeEditor: React.FC = () => {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-500 leading-relaxed font-semibold">
      <p className="font-bold text-slate-800 mb-1">{t('editor.end.title')}</p>
      <p>{t('editor.end.desc')}</p>
    </div>
  );
};
