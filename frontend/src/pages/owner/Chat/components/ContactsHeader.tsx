import React from 'react';
import { t } from '../../../../i18n/config';
import { UserPlus } from 'lucide-react';

interface ContactsHeaderProps {
  onCreateContact: () => void;
}

export const ContactsHeader: React.FC<ContactsHeaderProps> = ({ onCreateContact }) => {
  return (
    <header className="bg-canvas border-b-2 border-ink px-6 py-4 flex justify-between items-center shrink-0 z-20">
      <div>
        <h1 className="font-['Anybody',sans-serif] text-2xl font-black text-ink uppercase tracking-tight select-none">
          {t('crm.contacts.title')}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onCreateContact}
          className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-ink rounded-xl text-ink font-['JetBrains_Mono',monospace] text-xs font-bold hover:bg-ink hover:text-canvas transition-all cursor-pointer select-none"
        >
          <UserPlus size={14} />
          <span>{t('crm.contacts.btn.create')}</span>
        </button>
      </div>
    </header>
  );
};

