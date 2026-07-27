import React from 'react';
import { t } from '../../../../../i18n/config';

export const StartNodeEditor: React.FC = () => {
  return (
    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-500 leading-relaxed font-semibold">
      <p>{t('editor.start.desc')}</p>
    </div>
  );
};
