import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import type { BotUserResponse } from '../../../types/bot';
import { ContactAvatar } from './ContactAvatar';
import { t } from '../../../i18n/config';

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
      <div className="h-full flex items-center justify-center p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm m-6">
        <div className="max-w-sm space-y-3">
          <AlertCircle size={40} className="text-slate-300 mx-auto" />
          <p className="font-bold text-slate-700">{t('crm.contacts.no_bot_title')}</p>
          <p className="text-xs text-slate-400">{t('crm.contacts.no_bot_desc')}</p>
        </div>
      </div>
    );
  }

  if (isContactsLoading) {
    return (
      <div className="h-full flex items-center justify-center m-6">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  if (filteredContacts.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 italic bg-white rounded-2xl border border-slate-200 shadow-sm m-6">
        {t('crm.contacts.no_contacts_found')}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider select-none">
              <th className="py-4 pl-6 pr-2 w-10">
                <input
                  type="checkbox"
                  checked={
                    filteredContacts.length > 0 &&
                    filteredContacts.every((c) => selectedContactIds.has(c.id))
                  }
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </th>
              <th className="py-4 px-2 w-16">{t('crm.contacts.table.avatar')}</th>
              <th className="py-4 px-2">{t('crm.contacts.table.name')}</th>
              <th className="py-4 px-6">{t('crm.contacts.table.status')}</th>
              <th className="py-4 px-6">{t('crm.contacts.table.subscribed')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
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
                  className={`hover:bg-slate-50/50 transition-all cursor-pointer ${
                    isSelected ? 'bg-indigo-50/20' : ''
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
                      className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </td>
                  <td className="py-4 px-2 w-16">
                    <ContactAvatar photoUrl={c.photoUrl} name={c.firstName} size="md" />
                  </td>
                  <td className="py-4 px-2 font-bold text-slate-900">
                    <div className="flex flex-col">
                      <span>{c.firstName} {c.lastName}</span>
                      {c.username && (
                        <span className="text-[11px] font-normal text-slate-400">@{c.username}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isUnsubscribed
                          ? 'bg-rose-50 text-rose-600 border border-rose-100'
                          : isPaused
                          ? 'bg-amber-50 text-amber-600 border border-amber-100'
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}
                    >
                      {statusText}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-400 text-[11px]">
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
