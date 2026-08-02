import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import type { BotUserResponse } from '../../../../types/bot';
import { ContactAvatar } from './ContactAvatar';
import { t } from '../../../../i18n/config';

interface ContactsTableProps {
  botId: number;
  isContactsLoading: boolean;
  filteredContacts: BotUserResponse[];
  selectedContactIds: Set<number>;
  onSelectAll: (checked: boolean) => void;
  onSelectContact: (id: number, checked: boolean) => void;
  onSelectContactDetail: (contact: BotUserResponse) => void;
}

export const ContactsTable: React.FC<ContactsTableProps> = ({
  botId,
  isContactsLoading,
  filteredContacts,
  selectedContactIds,
  onSelectAll,
  onSelectContact,
  onSelectContactDetail,
}) => {
  const parseMetadata = (metaStr: string | null) => {
    try {
      return metaStr ? JSON.parse(metaStr) : {};
    } catch {
      return {};
    }
  };

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return t('common.time.just_now');
    if (diffMins < 60) return t('common.time.mins_ago', { count: diffMins });
    if (diffHours < 24) return t('common.time.hours_ago', { count: diffHours });
    if (diffDays < 30) return t('common.time.days_ago', { count: diffDays });
    return date.toLocaleDateString();
  };

  if (botId === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl m-6">
        <div className="max-w-sm space-y-3 font-['JetBrains_Mono',monospace]">
          <AlertCircle size={40} className="text-[#0A0A0A] mx-auto" />
          <p className="font-['Anybody',sans-serif] font-black text-[#0A0A0A] text-sm uppercase">{t('crm.contacts.no_bot_title')}</p>
          <p className="text-xs text-slate-700 font-medium">{t('crm.contacts.no_bot_desc')}</p>
        </div>
      </div>
    );
  }

  if (isContactsLoading) {
    return (
      <div className="h-full flex items-center justify-center m-6">
        <Loader2 className="animate-spin text-[#0A0A0A]" size={32} />
      </div>
    );
  }

  if (filteredContacts.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-[#0A0A0A] font-['JetBrains_Mono',monospace] font-bold text-xs bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl m-6">
        {t('crm.contacts.no_contacts_found')}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6 font-['JetBrains_Mono',monospace]">
      <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b-2 border-[#0A0A0A] text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider select-none">
              <th className="py-4 pl-6 pr-2 w-10">
                <input
                  type="checkbox"
                  checked={
                    filteredContacts.length > 0 &&
                    filteredContacts.every((c) => selectedContactIds.has(c.id))
                  }
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="accent-[#0A0A0A] cursor-pointer"
                />
              </th>
              <th className="py-4 px-2 w-16">{t('crm.contacts.table.avatar')}</th>
              <th className="py-4 px-2">{t('crm.contacts.table.name')}</th>
              <th className="py-4 px-6">{t('crm.contacts.table.status')}</th>
              <th className="py-4 px-6">{t('crm.contacts.table.subscribed')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#0A0A0A]/15 text-xs font-bold text-[#0A0A0A]">
            {filteredContacts.map((c) => {
              const isSelected = selectedContactIds.has(c.id);
              const meta = parseMetadata(c.metadata);
              const isPaused = meta.paused;
              const isUnsubscribed = meta.unsubscribed;

              let statusText = t('crm.contacts.status.subscribed');
              if (isUnsubscribed) statusText = t('crm.contacts.status.unsubscribed');
              else if (isPaused) statusText = t('crm.contacts.status.paused');

              return (
                <tr
                  key={c.id}
                  className={`hover:bg-white/70 transition-all cursor-pointer ${
                    isSelected ? 'bg-white/90' : ''
                  }`}
                  onClick={() => onSelectContactDetail(c)}
                >
                  <td
                    className="py-4 pl-6 pr-2 w-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => onSelectContact(c.id, e.target.checked)}
                      className="accent-[#0A0A0A] cursor-pointer"
                    />
                  </td>
                  <td className="py-4 px-2 w-16">
                    <ContactAvatar photoUrl={c.photoUrl} name={c.firstName} size="md" />
                  </td>
                  <td className="py-4 px-2 font-black text-[#0A0A0A]">
                    <div className="flex flex-col">
                      <span className="font-extrabold">{c.firstName} {c.lastName}</span>
                      {c.username && (
                        <span className="text-[11px] font-semibold text-slate-700">@{c.username}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border-2 border-[#0A0A0A] ${
                        isUnsubscribed
                          ? 'bg-rose-200 text-[#0A0A0A]'
                          : isPaused
                          ? 'bg-amber-200 text-[#0A0A0A]'
                          : 'bg-emerald-200 text-[#0A0A0A]'
                      }`}
                    >
                      {statusText}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-700 text-[11px] font-bold">
                    {getRelativeTime(c.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
