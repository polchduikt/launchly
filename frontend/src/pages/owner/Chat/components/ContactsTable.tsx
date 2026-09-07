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

const formatRelativeTime = (dateStr: string) => {
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
          className="accent-ink cursor-pointer"
        />
      </td>
      <td className="py-4 px-2 w-16">
        <ContactAvatar photoUrl={c.photoUrl} name={c.firstName} size="md" />
      </td>
      <td className="py-4 px-2 font-black text-ink">
        <div className="flex flex-col">
          <span className="font-extrabold">{c.firstName} {c.lastName}</span>
          {c.username && (
            <span className="text-[11px] font-semibold text-slate-700">@{c.username}</span>
          )}
        </div>
      </td>
      <td className="py-4 px-6">
        <span
          className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border-2 border-ink ${
            isUnsubscribed
              ? 'bg-rose-200 text-ink'
              : isPaused
              ? 'bg-amber-200 text-ink'
              : 'bg-emerald-200 text-ink'
          }`}
        >
          {statusText}
        </span>
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
        <TableSkeleton rows={7} columns={5} />
      </div>
    );
  }

  if (botId === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center bg-canvas m-6">
        <div className="max-w-md space-y-4 font-['JetBrains_Mono',monospace] bg-canvas border-2 border-ink rounded-3xl p-10 shadow-brutal">
          <div className="w-16 h-16 rounded-2xl bg-white border-2 border-ink shadow-brutal flex items-center justify-center mx-auto text-ink">
            <AlertCircle size={32} />
          </div>
          <p className="font-['Anybody',sans-serif] font-black text-ink text-xl uppercase tracking-tight">{t('crm.contacts.no_bot_title')}</p>
          <p className="font-['Geist',sans-serif] text-xs text-ink/70 font-semibold max-w-xs mx-auto leading-relaxed">{t('crm.contacts.no_bot_desc')}</p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/connect-bot')}
              className="px-6 py-3 bg-ink text-canvas font-['JetBrains_Mono',monospace] text-xs font-black uppercase tracking-wider border-2 border-ink shadow-brutal hover:bg-white hover:text-ink hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer inline-flex items-center gap-2"
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
      <div className="h-full flex items-center justify-center text-ink font-['JetBrains_Mono',monospace] font-bold text-xs bg-canvas border-2 border-ink rounded-2xl m-6">
        {t('crm.contacts.no_contacts_found')}
      </div>
    );
  }

  return (
    <div ref={parentRef} className="flex-1 overflow-auto p-6 font-['JetBrains_Mono',monospace]">
      <div className="bg-canvas border-2 border-ink rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b-2 border-ink text-[10px] font-black text-ink uppercase tracking-wider select-none">
              <th className="py-4 pl-6 pr-2 w-10">
                <input
                  type="checkbox"
                  checked={
                    filteredContacts.length > 0 &&
                    filteredContacts.every((c) => selectedContactIds.has(c.id))
                  }
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="accent-ink cursor-pointer"
                />
              </th>
              <th className="py-4 px-2 w-16">{t('crm.contacts.table.avatar')}</th>
              <th className="py-4 px-2">{t('crm.contacts.table.name')}</th>
              <th className="py-4 px-6">{t('crm.contacts.table.status')}</th>
              <th className="py-4 px-6">{t('crm.contacts.table.subscribed')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/15 text-xs font-bold text-ink">
            {paddingTop > 0 && (
              <tr>
                <td style={{ height: `${paddingTop}px` }} colSpan={5} />
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
                <td style={{ height: `${paddingBottom}px` }} colSpan={5} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
