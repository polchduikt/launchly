import React from 'react';
import { Layers } from 'lucide-react';
import { t } from '../../../i18n';

interface SequenceItem {
  id: string;
  count: number;
}

interface ContactsSidebarProps {
  sequences: SequenceItem[];
}

export const ContactsSidebar: React.FC<ContactsSidebarProps> = ({ sequences }) => {
  return (
    <aside className="w-64 border-r border-slate-200 bg-white p-5 space-y-6 shrink-0 hidden md:block select-none shadow-[1px_0_0_0_rgba(226,232,240,0.8)]">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{t('crm.contacts.sidebar.segments')}</h3>
          <span className="bg-blue-100 text-blue-700 font-extrabold text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded shadow-sm">{t('crm.contacts.sidebar.upgrade')}</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {t('crm.contacts.sidebar.segments_desc')}
        </p>
      </div>

      <div className="border-t border-slate-100 pt-5 space-y-3">
        <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
          <span>{t('crm.contacts.sidebar.sequences')}</span>
          <span>{t('crm.contacts.sidebar.contacts')}</span>
        </div>
        <div className="space-y-1">
          {sequences.map((seq) => (
            <div key={seq.id} className="flex justify-between items-center py-1.5 px-2 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 cursor-pointer transition-all">
              <div className="flex items-center gap-2">
                <Layers size={13} className="text-slate-400" />
                <span>{seq.id}</span>
              </div>
              <span className="text-slate-400 font-semibold">{seq.count}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
