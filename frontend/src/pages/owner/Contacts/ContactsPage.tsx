import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useBotStore } from '../../../store/useBotStore';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import {
  useBotUsersQuery,
  useUpdateBotUserMutation,
  useDeleteBotUserMutation,
  useConversationsQuery,
  useCreateBotUserMutation,
} from '../../../hooks/crm/useCrmQueries';
import { useTagsQuery } from '../../../hooks/broadcast/useBroadcastQueries';
import {
  Filter,
  Search,
  ChevronDown,
  Tag,
  X,
  Pause,
  Play,
  Bookmark,
  Lock,
  Trash2,
} from 'lucide-react';
import type { BotUserResponse } from '../../../types/bot';
import { ContactsHeader } from '../Chat/components/ContactsHeader';
import { BulkActionModal } from '../Chat/components/BulkActionModal';
import { ContactsTable } from '../Chat/components/ContactsTable';
import { ContactDetailModal } from '../Chat/components/ContactDetailModal';
import { CreateContactModal } from '../Chat/components/CreateContactModal';
import { ContactsFilterBuilder } from '../Chat/components/ContactsFilterBuilder';
import type { BotUserMetadata, FilterCondition } from '../../../types/crm';

import { useTranslation } from '../../../i18n/config';
import { useBotsQuery } from '../../../hooks/bot/useBotsQuery';

export const ContactsPage: React.FC = () => {
  const { t } = useTranslation();
  const activeBotId = useBotStore((state) => state.activeBotId);
  const { data: bots = [] } = useBotsQuery();

  const botId = activeBotId || (bots[0]?.id || 0);

  const { data: contacts = [], isLoading: isContactsLoading, refetch } = useBotUsersQuery(botId);
  const { data: conversations = [] } = useConversationsQuery(botId);
  const { data: tags = [] } = useTagsQuery(botId);

  const updateBotUserMut = useUpdateBotUserMutation(botId);
  const deleteBotUserMut = useDeleteBotUserMutation(botId);
  const createBotUserMut = useCreateBotUserMutation(botId);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState<Set<number>>(new Set());
  const [selectedContact, setSelectedContact] = useState<BotUserResponse | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFiltersBuilder, setShowFiltersBuilder] = useState(false);
  const [conditions, setConditions] = useState<FilterCondition[]>([]);
  
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<string | null>(null);

  const handleCreateContact = async (data: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    gender: string;
  }) => {
    await createBotUserMut.mutateAsync(data);
    setShowCreateModal(false);
    refetch();
  };

  const bulkMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (bulkMenuRef.current && !bulkMenuRef.current.contains(e.target as Node)) {
        setShowBulkMenu(false);
      }
    };
    if (showBulkMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showBulkMenu]);

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
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = fullname.includes(q) || username.includes(q) || String(c.telegramId).includes(q);
      if (!matchesSearch) return false;
      if (conditions.length === 0) return true;
      let meta: Record<string, unknown> = {};
      try {
        meta = c.metadata ? JSON.parse(c.metadata) : {};
      } catch {}

      return conditions.every((cond) => {
        let fieldVal = '';
        
        if (cond.field === 'tag') {
          const hasTag = (c.tags || []).includes(cond.value);
          return cond.operator === 'is' ? hasTag : !hasTag;
        }

        if (cond.field === 'paused') {
          const isPaused = !!meta.paused;
          const target = cond.value === 'true';
          return cond.operator === 'is' ? (isPaused === target) : (isPaused !== target);
        }

        if (cond.field === 'optedInTelegram') {
          const isOptedIn = !meta.unsubscribed;
          const target = cond.value === 'true';
          return cond.operator === 'is' ? (isOptedIn === target) : (isOptedIn !== target);
        }

        if (cond.field === 'firstName') {
          fieldVal = c.firstName || '';
        } else if (cond.field === 'lastName') {
          fieldVal = c.lastName || '';
        } else if (cond.field === 'fullName') {
          fieldVal = `${c.firstName || ''} ${c.lastName || ''}`;
        } else if (cond.field === 'email') {
          fieldVal = meta.email || (meta as any).customFields?.Email || (meta as any).customFields?.email || '';
        } else if (cond.field === 'phone') {
          fieldVal = meta.phone || (meta as any).customFields?.Phone || (meta as any).customFields?.phone || '';
        } else if (cond.field === 'id') {
          fieldVal = String(c.id);
        } else if (cond.field === 'telegramUserId') {
          fieldVal = String(c.telegramId);
        } else if (cond.field === 'telegramUsername') {
          fieldVal = c.username || '';
        } else if (cond.field === 'createdAt') {
          fieldVal = c.createdAt ? c.createdAt.split('T')[0] : '';
        } else if (cond.field.startsWith('custom:')) {
          const customKey = cond.field.substring(7);
          fieldVal = (meta as any).customFields?.[customKey] || '';
        }

        const condVal = cond.value || '';
        const fieldLower = fieldVal.toLowerCase().trim();
        const condLower = condVal.toLowerCase().trim();
        
        if (cond.operator === 'is') {
          return fieldLower === condLower;
        } else if (cond.operator === 'is_not') {
          return fieldLower !== condLower;
        } else if (cond.operator === 'contains') {
          return fieldLower.includes(condLower);
        } else if (cond.operator === "doesn't contain") {
          return !fieldLower.includes(condLower);
        } else if (cond.operator === 'begins with') {
          return fieldLower.startsWith(condLower);
        } else if (cond.operator === 'has any value') {
          return fieldVal.trim() !== '';
        } else if (cond.operator === 'is unknown') {
          return fieldVal.trim() === '';
        } else if (cond.operator === 'after') {
          return fieldVal > condVal;
        } else if (cond.operator === 'before') {
          return fieldVal < condVal;
        }

        return true;
      });
    });
  }, [contacts, searchQuery, conditions]);

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

  const handleApplyBulkAction = async (actionType: string, actionValue: string) => {
    const ids = Array.from(selectedContactIds);

    for (const userId of ids) {
      const c = contacts.find((x) => x.id === userId);
      if (!c) continue;

      const meta = parseMetadata(c.metadata);
      const updatedMeta = { ...meta };
      let updatedTags = [...(c.tags || [])];

      if (actionType === 'add-tag') {
        if (actionValue && !updatedTags.includes(actionValue)) {
          updatedTags.push(actionValue);
        }
      } else if (actionType === 'remove-tag') {
        updatedTags = updatedTags.filter((t) => t !== actionValue);
      } else if (actionType === 'pause') {
        updatedMeta.paused = true;
      } else if (actionType === 'resume') {
        updatedMeta.paused = false;
      } else if (actionType === 'unsub-acc') {
        updatedMeta.unsubscribed = true;
      } else if (actionType === 'delete') {
        await deleteBotUserMut.mutateAsync(userId);
        continue;
      } else if (actionType === 'set-field') {
        const [fieldKey, fieldVal] = actionValue.split(':');
        if (fieldKey) {
          const fields = meta.customFields || {};
          updatedMeta.customFields = { ...fields, [fieldKey.trim()]: (fieldVal || '').trim() };
        }
      } else if (actionType === 'clear-field') {
        const fields = { ...(meta.customFields || {}) };
        delete (fields as Record<string, any>)[actionValue];
        updatedMeta.customFields = { ...fields };
      }

      if (actionType !== 'delete') {
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
    setShowBulkMenu(false);
    refetch();
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)] flex bg-slate-50 font-sans">
        <main className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden">
          
          <ContactsHeader
            onCreateContact={() => setShowCreateModal(true)}
          />

          <div className="px-6 py-3 bg-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 select-none">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFiltersBuilder(!showFiltersBuilder)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
                  showFiltersBuilder
                    ? 'bg-blue-50 border border-blue-200 text-blue-600'
                    : 'bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600'
                }`}
              >
                <Filter size={14} className={showFiltersBuilder ? 'text-blue-500' : 'text-slate-400'} />
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
              <div className="relative" ref={bulkMenuRef}>
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

          <ContactsFilterBuilder
            isOpen={showFiltersBuilder}
            conditions={conditions}
            setConditions={setConditions}
            tags={tags}
            contacts={contacts}
            botId={botId}
          />



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

      {bulkActionType && (
        <BulkActionModal
          isOpen={true}
          onClose={() => {
            setBulkActionType(null);
          }}
          actionType={bulkActionType}
          selectedCount={selectedContactIds.size}
          tags={tags}
          onApply={(value) => {
            handleApplyBulkAction(bulkActionType, value);
          }}
        />
      )}

      <CreateContactModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateContact}
      />
    </DashboardLayout>
  );
};
