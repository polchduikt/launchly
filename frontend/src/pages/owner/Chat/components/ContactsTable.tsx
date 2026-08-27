import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Plus } from 'lucide-react';
import type { BotUserResponse } from '../../../../types/bot';
import { ContactAvatar } from './ContactAvatar';
import { t } from '../../../../i18n/config';
import { useVirtualList } from '../../../../hooks/useVirtualList';
import { TableSkeleton } from '../../../../components/common/Skeleton';

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
  const navigate = useNavigate();

  const { parentRef, virtualItems, totalHeight } = useVirtualList({
    count: filteredContacts.length,
    itemHeight: 64,
    overscan: 4,
  });

  const firstItem = virtualItems[0];
  const lastItem = virtualItems[virtualItems.length - 1];
  const paddingTop = firstItem ? firstItem.offsetTop : 0;
  const paddingBottom = lastItem ? Math.max(0, totalHeight - (lastItem.offsetTop + lastItem.size)) : 0;

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
      <div className="h-full flex items-center justify-center p-8 text-center bg-[#F2EBDD] m-6">
        <div className="max-w-md space-y-4 font-['JetBrains_Mono',monospace] bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl p-10 shadow-[4px_4px_0px_#0A0A0A]">
          <div className="w-16 h-16 rounded-2xl bg-white border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] flex items-center justify-center mx-auto text-[#0A0A0A]">
            <AlertCircle size={32} />
          </div>
          <p className="font-['Anybody',sans-serif] font-black text-[#0A0A0A] text-xl uppercase tracking-tight">{t('crm.contacts.no_bot_title')}</p>
          <p className="font-['Geist',sans-serif] text-xs text-[#0A0A0A]/70 font-semibold max-w-xs mx-auto leading-relaxed">{t('crm.contacts.no_bot_desc')}</p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/connect-bot')}
              className="px-6 py-3 bg-[#0A0A0A] text-[#F2EBDD] font-['JetBrains_Mono',monospace] text-xs font-black uppercase tracking-wider border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:bg-white hover:text-[#0A0A0A] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <Plus size={14} />
              <span>{t('connect_bot.btn_connect_existing', 'Connect Bot')}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isContactsLoading) {
    return (
      <div className="flex-1 overflow-auto p-6 font-['JetBrains_Mono',monospace]">
        <TableSkeleton rows={7} columns={5} />
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
    <div ref={parentRef} className="flex-1 overflow-auto p-6 font-['JetBrains_Mono',monospace]">
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
            {paddingTop > 0 && (
              <tr>
                <td style={{ height: `${paddingTop}px` }} colSpan={5} />
              </tr>
            )}
            {virtualItems.map(({ index }) => {
              const c = filteredContacts[index];
              if (!c) return null;

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
            {paddingBottom > 0 && (
              <tr>
                <td style={{ height: `${paddingBottom}px` }} colSpan={5} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
