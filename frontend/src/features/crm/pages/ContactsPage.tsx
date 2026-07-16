import React, { useState, useMemo } from 'react';
import { useBotStore } from '../../../store/useBotStore';
import { DashboardLayout } from '../../../components/layouts/DashboardLayout';
import {
  useBotUsersQuery,
  useUpdateBotUserMutation,
  useDeleteBotUserMutation,
  useConversationsQuery,
} from '../hooks/useCrmQueries';
import { useTagsQuery } from '../../broadcast/hooks/useBroadcastQueries';
import {
  Filter,
  Search,
  ChevronDown,
  Tag,
  X,
  Plus,
  Pause,
  Play,
  Bookmark,
  Lock,
  Trash2,
} from 'lucide-react';
import type { BotUserResponse } from '../../../types/bot';
import { ContactsSidebar } from '../components/ContactsSidebar';
import { ContactsHeader } from '../components/ContactsHeader';
import { ContactsTable } from '../components/ContactsTable';
import { ContactDetailModal } from '../components/ContactDetailModal';
import { t } from '../../../i18n';

interface BotUserMetadata {
  sequences?: string[];
  paused?: boolean;
  unsubscribed?: boolean;
  customFields?: Record<string, string>;
}

import { useBotsQuery } from '../../bot/hooks/useBotsQuery';

export const ContactsPage: React.FC = () => {
  const activeBotId = useBotStore((state) => state.activeBotId);
  const { data: bots = [] } = useBotsQuery();

  const botId = activeBotId || (bots[0]?.id || 0);

  const { data: contacts = [], isLoading: isContactsLoading, refetch } = useBotUsersQuery(botId);
  const { data: conversations = [] } = useConversationsQuery(botId);
  const { data: tags = [] } = useTagsQuery(botId);

  const updateBotUserMut = useUpdateBotUserMutation(botId);
  const deleteBotUserMut = useDeleteBotUserMutation(botId);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState<Set<number>>(new Set());
  const [selectedContact, setSelectedContact] = useState<BotUserResponse | null>(null);
  
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<string | null>(null);
  const [bulkValue, setBulkValue] = useState('');

  const parseMetadata = (metaStr: string | null): BotUserMetadata => {
    try {
      return metaStr ? JSON.parse(metaStr) : {};
    } catch {
      return {};
    }
  };

  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const fullname = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
      const username = (c.username || '').toLowerCase();
      const q = searchQuery.toLowerCase();
      return fullname.includes(q) || username.includes(q) || String(c.telegramId).includes(q);
    });
  }, [contacts, searchQuery]);

  const sequences = useMemo(() => {
    const counts: Record<string, number> = { '1': 0 };
    contacts.forEach((c) => {
      const meta = parseMetadata(c.metadata);
      if (meta.sequences) {
        meta.sequences.forEach((s) => {
          counts[s] = (counts[s] || 0) + 1;
        });
      }
    });
    return Object.entries(counts).map(([id, count]) => ({ id, count }));
  }, [contacts]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContactIds(new Set(filteredContacts.map((c) => c.id)));
    } else {
      setSelectedContactIds(new Set());
    }
  };

  const handleSelectContact = (id: number, checked: boolean) => {
    const next = new Set(selectedContactIds);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    setSelectedContactIds(next);
  };

  const handleApplyBulkAction = async () => {
    if (!bulkActionType) return;
    const ids = Array.from(selectedContactIds);

    for (const userId of ids) {
      const c = contacts.find((x) => x.id === userId);
      if (!c) continue;

      const meta = parseMetadata(c.metadata);
      const updatedMeta = { ...meta };
      let updatedTags = [...(c.tags || [])];

      if (bulkActionType === 'add-tag') {
        if (bulkValue && !updatedTags.includes(bulkValue)) {
          updatedTags.push(bulkValue);
        }
      } else if (bulkActionType === 'remove-tag') {
        updatedTags = updatedTags.filter((t) => t !== bulkValue);
      } else if (bulkActionType === 'sub-seq') {
        const seqs = meta.sequences || [];
        if (!seqs.includes(bulkValue)) {
          updatedMeta.sequences = [...seqs, bulkValue];
        }
      } else if (bulkActionType === 'unsub-seq') {
        const seqs = meta.sequences || [];
        updatedMeta.sequences = seqs.filter((s) => s !== bulkValue);
      } else if (bulkActionType === 'pause') {
        updatedMeta.paused = true;
      } else if (bulkActionType === 'resume') {
        updatedMeta.paused = false;
      } else if (bulkActionType === 'unsub-acc') {
        updatedMeta.unsubscribed = true;
      } else if (bulkActionType === 'delete') {
        await deleteBotUserMut.mutateAsync(userId);
        continue;
      } else if (bulkActionType === 'set-field') {
        const [fieldKey, fieldVal] = bulkValue.split(':');
        if (fieldKey) {
          const fields = meta.customFields || {};
          updatedMeta.customFields = { ...fields, [fieldKey.trim()]: (fieldVal || '').trim() };
        }
      } else if (bulkActionType === 'clear-field') {
        const fields = meta.customFields || {};
        delete fields[bulkValue];
        updatedMeta.customFields = { ...fields };
      }

      if (bulkActionType !== 'delete') {
        await updateBotUserMut.mutateAsync({
          userId,
          data: {
            metadata: JSON.stringify(updatedMeta),
            tags: updatedTags,
          },
        });
      }
    }

    setSelectedContactIds(new Set());
    setBulkActionType(null);
    setBulkValue('');
    setShowBulkMenu(false);
    refetch();
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)] flex bg-slate-50 font-sans">
        
        <ContactsSidebar sequences={sequences} />

        <main className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden">
          
          <ContactsHeader
            onCreateContact={() => alert('Feature coming soon: Manual Contact Creation')}
            onImport={() => alert('Feature coming soon: Contact Import')}
          />

          <div className="px-6 py-3 bg-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 select-none">
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 transition-all cursor-pointer shadow-sm">
                <Filter size={14} className="text-slate-400" />
                <span>{t('crm.contacts.filter')}</span>
              </button>
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('crm.contacts.search_placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <span className="text-xs font-bold text-slate-500">
                {t('crm.contacts.selected_count', { count: selectedContactIds.size, total: filteredContacts.length })}
              </span>
              <div className="relative">
                <button
                  onClick={() => setShowBulkMenu(!showBulkMenu)}
                  disabled={selectedContactIds.size === 0}
                  className="flex items-center gap-1 px-3 py-2 bg-white hover:bg-slate-50 disabled:opacity-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-sm"
                >
                  <span>{t('crm.contacts.btn.bulk_actions')}</span>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>

                {showBulkMenu && (
                  <div className="absolute right-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1.5 overflow-hidden text-xs font-bold text-slate-700">
                    <button onClick={() => setBulkActionType('add-tag')} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer">
                      <Tag size={13} className="text-slate-400" /> {t('crm.contacts.bulk.add_tag')}
                    </button>
                    <button onClick={() => setBulkActionType('remove-tag')} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer">
                      <X size={13} className="text-slate-400" /> {t('crm.contacts.bulk.remove_tag')}
                    </button>
                    <button onClick={() => setBulkActionType('sub-seq')} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer">
                      <Plus size={13} className="text-slate-400" /> {t('crm.contacts.bulk.sub_seq')}
                    </button>
                    <button onClick={() => setBulkActionType('unsub-seq')} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer">
                      <X size={13} className="text-slate-400" /> {t('crm.contacts.bulk.unsub_seq')}
                    </button>
                    <button onClick={() => setBulkActionType('pause')} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer">
                      <Pause size={13} className="text-slate-400" /> {t('crm.contacts.bulk.pause')}
                    </button>
                    <button onClick={() => setBulkActionType('resume')} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer">
                      <Play size={13} className="text-slate-400" /> {t('crm.contacts.bulk.resume')}
                    </button>
                    <button onClick={() => setBulkActionType('set-field')} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer">
                      <Bookmark size={13} className="text-slate-400" /> {t('crm.contacts.bulk.set_field')}
                    </button>
                    <button onClick={() => setBulkActionType('clear-field')} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer">
                      <X size={13} className="text-slate-400" /> {t('crm.contacts.bulk.clear_field')}
                    </button>
                    <div className="border-t border-slate-100 my-1"></div>
                    <button onClick={() => setBulkActionType('unsub-acc')} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer text-amber-600">
                      <Lock size={13} className="text-amber-500" /> {t('crm.contacts.bulk.unsub_acc')}
                    </button>
                    <button onClick={() => setBulkActionType('delete')} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer text-rose-600">
                      <Trash2 size={13} className="text-rose-500" /> {t('crm.contacts.bulk.delete')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {bulkActionType && (
            <div className="px-6 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between gap-4 text-xs font-bold text-indigo-950 shrink-0 animation-slide-in">
              <div className="flex items-center gap-3 flex-1">
                <span>
                  {t('crm.contacts.bulk.header', { action: bulkActionType.replace('-', ' ').toUpperCase(), count: selectedContactIds.size })}
                </span>
                
                {['add-tag', 'remove-tag'].includes(bulkActionType) && (
                  <select
                    value={bulkValue}
                    onChange={(e) => setBulkValue(e.target.value)}
                    className="px-2 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs focus:outline-none"
                  >
                    <option value="">{t('crm.contacts.bulk.select_tag')}</option>
                    {tags.map((t) => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                    {bulkActionType === 'add-tag' && (
                      <option value="NEW_TAG">{t('crm.contacts.bulk.new_tag_option')}</option>
                    )}
                  </select>
                )}

                {['sub-seq', 'unsub-seq'].includes(bulkActionType) && (
                  <select
                    value={bulkValue}
                    onChange={(e) => setBulkValue(e.target.value)}
                    className="px-2 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs focus:outline-none"
                  >
                    <option value="">{t('crm.contacts.bulk.select_seq')}</option>
                    <option value="1">Sequence 1</option>
                  </select>
                )}

                {bulkActionType === 'add-tag' && bulkValue === 'NEW_TAG' && (
                  <input
                    type="text"
                    placeholder={t('crm.contacts.bulk.enter_tag')}
                    onChange={(e) => setBulkValue(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs focus:outline-none"
                  />
                )}

                {bulkActionType === 'set-field' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={t('crm.contacts.bulk.field_name_placeholder')}
                      id="bulkFieldKey"
                      className="px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs w-36 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder={t('crm.contacts.bulk.field_value_placeholder')}
                      id="bulkFieldVal"
                      className="px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs w-36 focus:outline-none"
                      onBlur={() => {
                        const k = (document.getElementById('bulkFieldKey') as HTMLInputElement)?.value;
                        const v = (document.getElementById('bulkFieldVal') as HTMLInputElement)?.value;
                        if (k) setBulkValue(`${k}:${v}`);
                      }}
                    />
                  </div>
                )}

                {bulkActionType === 'clear-field' && (
                  <input
                    type="text"
                    placeholder={t('crm.contacts.bulk.field_clear_placeholder')}
                    value={bulkValue}
                    onChange={(e) => setBulkValue(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs focus:outline-none"
                  />
                )}

                {['pause', 'resume', 'unsub-acc', 'delete'].includes(bulkActionType) && (
                  <span className="text-slate-400 italic font-semibold">{t('crm.contacts.bulk.no_val_needed')}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleApplyBulkAction}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer transition-all"
                >
                  {t('crm.contacts.bulk.btn_apply')}
                </button>
                <button
                  onClick={() => {
                    setBulkActionType(null);
                    setBulkValue('');
                  }}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-all"
                >
                  {t('crm.contacts.bulk.btn_cancel')}
                </button>
              </div>
            </div>
          )}

          <ContactsTable
            botId={botId}
            isContactsLoading={isContactsLoading}
            filteredContacts={filteredContacts}
            selectedContactIds={selectedContactIds}
            onSelectAll={handleSelectAll}
            onSelectContact={handleSelectContact}
            onSelectContactDetail={setSelectedContact}
          />
        </main>
      </div>

      {selectedContact && (
        <ContactDetailModal
          botId={botId}
          selectedContact={selectedContact}
          conversations={conversations}
          tags={tags}
          onClose={() => setSelectedContact(null)}
          onContactUpdated={setSelectedContact}
          onContactDeleted={() => setSelectedContact(null)}
        />
      )}
    </DashboardLayout>
  );
};
