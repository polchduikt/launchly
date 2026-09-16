import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Plus } from 'lucide-react';
import type { BotUserResponse } from '../../../../types/bot';
import { ContactAvatar } from './ContactAvatar';
import { t } from '../../../../i18n/config';
import { useVirtualList } from '../../../../hooks/useVirtualList';
import { TableSkeleton } from '../../../../components/common/Skeleton';

interface ContactsTableProps {
  botId: number;
  isBotsLoading?: boolean;
  isContactsLoading: boolean;
  filteredContacts: BotUserResponse[];
  selectedContactIds: Set<number>;
  onSelectAll: (checked: boolean) => void;
  onSelectContact: (id: number, checked: boolean) => void;
  onSelectContactDetail: (contact: BotUserResponse) => void;
}

import { formatRelativeTime } from '../../../../utils/date';

interface ContactTableRowProps {
  contact: BotUserResponse;
  isSelected: boolean;
  onToggleSelect: (id: number, checked: boolean) => void;
  onSelectDetail: (contact: BotUserResponse) => void;
}

const parseContactMetadata = (metaStr: string | null) => {
  try {
    return metaStr ? JSON.parse(metaStr) : {};
  } catch {
    return {};
  }
};

const ContactTableRow = React.memo<ContactTableRowProps>(({
  contact: c,
  isSelected,
  onToggleSelect,
  onSelectDetail,
}) => {
  const meta = parseContactMetadata(c.metadata);
  const isPaused = meta.paused;
  const isUnsubscribed = meta.unsubscribed;

  let statusText = t('crm.contacts.status.subscribed');
  if (isUnsubscribed) statusText = t('crm.contacts.status.unsubscribed');
  else if (isPaused) statusText = t('crm.contacts.status.paused');

  return (
    <tr
      className={`hover:bg-white/70 transition-all cursor-pointer ${
        isSelected ? 'bg-white/90' : ''
      }`}
      onClick={() => onSelectDetail(c)}
    >
      <td
        className="py-4 pl-6 pr-2 w-10"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onToggleSelect(c.id, e.target.checked)}
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
      <td className="py-4 px-4 text-center font-bold text-xs text-[#0A0A0A]">
        {c.botName || '—'}
      </td>
      <td className="py-4 px-6 text-center">
        <div className="flex justify-center">
          <span
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${
              isUnsubscribed
                ? 'bg-rose-50 text-rose-700 border border-rose-100 shadow-sm shadow-rose-50'
                : isPaused
                ? 'bg-amber-50 text-amber-700 border border-amber-100 shadow-sm shadow-amber-50'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm shadow-emerald-50'
            }`}
          >
            {statusText}
          </span>
        </div>
      </td>
      <td className="py-4 px-6 text-slate-700 text-[11px] font-bold">
        {formatRelativeTime(c.createdAt)}
      </td>
    </tr>
  );
});

ContactTableRow.displayName = 'ContactTableRow';

export const ContactsTable: React.FC<ContactsTableProps> = ({
  botId,
  isBotsLoading,
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

  if (isContactsLoading || isBotsLoading) {
    return (
      <div className="flex-1 overflow-auto p-6 font-['JetBrains_Mono',monospace]">
        <TableSkeleton rows={7} columns={6} />
      </div>
    );
  }

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
              <th className="py-4 px-4 text-center">{t('crm.contacts.table.automation')}</th>
              <th className="py-4 px-6 text-center">{t('crm.contacts.table.status')}</th>
              <th className="py-4 px-6">{t('crm.contacts.table.subscribed')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#0A0A0A]/15 text-xs font-bold text-[#0A0A0A]">
            {paddingTop > 0 && (
              <tr>
                <td style={{ height: `${paddingTop}px` }} colSpan={6} />
              </tr>
            )}
            {virtualItems.map(({ index }) => {
              const c = filteredContacts[index];
              if (!c) return null;

              return (
                <ContactTableRow
                  key={c.id}
                  contact={c}
                  isSelected={selectedContactIds.has(c.id)}
                  onToggleSelect={onSelectContact}
                  onSelectDetail={onSelectContactDetail}
                />
              );
            })}
            {paddingBottom > 0 && (
              <tr>
                <td style={{ height: `${paddingBottom}px` }} colSpan={6} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
