import React from 'react';
import { t } from '../../../../i18n/config';

interface ContactsHeaderProps {
  onCreateContact: () => void;
}

export const ContactsHeader: React.FC<ContactsHeaderProps> = ({ onCreateContact }) => {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0 shadow-sm">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t('crm.contacts.title')}</h1>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onCreateContact}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
        >
          {t('crm.contacts.btn.create')}
        </button>
      </div>
    </header>
  );
};
