import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Send,
  ExternalLink,
  MessageSquare,
  Trash2,
  X,
  Check,
  Plus,
} from 'lucide-react';
import type { BotUserResponse, BotUserUpdateRequest } from '../../../../types/bot';
import type { TagResponse } from '../../../../types';
import { ContactAvatar } from './ContactAvatar';
import { useUpdateBotUserMutation, useDeleteBotUserMutation } from '../../../../hooks/crm/useCrmQueries';
import { ROUTES } from '../../../../routes/paths';
import { t } from '../../../../i18n/config';
import { createTagApi } from '../../../../api/broadcast';
import { getCustomFieldsApi, saveCustomFieldsApi } from '../../../../api/bot';
import { TagSearchSelect } from '../../FlowBuilder/components/sidebar/editors/TagSearchSelect';
import { ConfirmModal } from '../../../../components/common/ConfirmModal';

import type { ConversationResponse, BotUserMetadata } from '../../../../types/crm';

interface ContactDetailModalProps {
  botId: number;
  selectedContact: BotUserResponse;
  conversations: ConversationResponse[];
  tags: TagResponse[];
  onClose: () => void;
  onContactUpdated: (updated: BotUserResponse) => void;
  onContactDeleted: () => void;
}

export const ContactDetailModal: React.FC<ContactDetailModalProps> = ({
  botId,
  selectedContact,
  conversations,
  tags,
  onClose,
  onContactUpdated,
  onContactDeleted,
}) => {
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateBotUserMut = useUpdateBotUserMutation(botId);
  const deleteBotUserMut = useDeleteBotUserMutation(botId);

  const [showAddTagInline, setShowAddTagInline] = useState(false);
  const [newTagVal, setNewTagVal] = useState('');
  const [customTagName, setCustomTagName] = useState('');
  const [showAddCustomFieldInline, setShowAddCustomFieldInline] = useState(false);
  const [customFieldName, setCustomFieldName] = useState('');
  const [customFieldValue, setCustomFieldValue] = useState('');

  const parseMetadata = (metaStr: string | null): BotUserMetadata => {
    try {
      return metaStr ? JSON.parse(metaStr) : {};
    } catch {
      return {};
    }
  };

  const meta = parseMetadata(selectedContact.metadata);
  const isPaused = meta.paused;
  const isUnsubscribed = meta.unsubscribed;

  const handleUpdateContactMetadata = (updatedMeta: BotUserMetadata) => {
    updateBotUserMut.mutate(
      { userId: selectedContact.id, data: { metadata: JSON.stringify(updatedMeta) } },
      { onSuccess: (updated) => { onContactUpdated(updated); } }
    );
  };

  const handleAddTagInline = (tagName: string) => {
    if (!tagName.trim()) return;
    const trimmed = tagName.trim();
    if ((selectedContact.tags || []).includes(trimmed)) return;
    if (botId) createTagApi(botId, { name: trimmed }).catch(() => {});
    updateBotUserMut.mutate(
      { userId: selectedContact.id, data: { tags: [...(selectedContact.tags || []), trimmed] } },
      { onSuccess: (updated) => { onContactUpdated(updated); setNewTagVal(''); setShowAddTagInline(false); } }
    );
  };

  const handleRemoveTagInline = (tagName: string) => {
    updateBotUserMut.mutate(
      { userId: selectedContact.id, data: { tags: (selectedContact.tags || []).filter((t) => t !== tagName) } },
      { onSuccess: (updated) => { onContactUpdated(updated); } }
    );
  };

  const handleAddCustomFieldInline = () => {
    if (!customFieldName.trim()) return;
    const nameTrimmed = customFieldName.trim();
    const fields = meta.customFields || {};
    handleUpdateContactMetadata({ ...meta, customFields: { ...fields, [nameTrimmed]: customFieldValue } });
    if (botId) {
      getCustomFieldsApi(botId).then((existing) => {
        const list = existing && Array.isArray(existing.fields) ? existing.fields : Array.isArray(existing) ? existing : [];
        if (!list.some((f: any) => f.name === nameTrimmed)) {
          saveCustomFieldsApi(botId, { fields: [...list, { name: nameTrimmed, type: 'Text', description: '', folder: null }] }).catch(() => {});
        }
      }).catch(() => {});
    }
    setCustomFieldName(''); setCustomFieldValue(''); setShowAddCustomFieldInline(false);
  };

  const handleRemoveCustomFieldInline = (fieldKey: string) => {
    const fields = { ...(meta.customFields || {}) };
    delete (fields as Record<string, any>)[fieldKey];
    handleUpdateContactMetadata({ ...meta, customFields: { ...fields } });
  };

  const handleUpdateName = (field: 'first' | 'last', val: string) => {
    const data: BotUserUpdateRequest = {};
    if (field === 'first') { if (selectedContact.firstName === val) return; data.firstName = val; }
    else { if ((selectedContact.lastName || '') === val) return; data.lastName = val; }
    updateBotUserMut.mutate({ userId: selectedContact.id, data }, { onSuccess: (updated) => { onContactUpdated(updated); } });
  };

  const handleStartChat = () => {
    const conv = conversations.find((c) => c.botUserTelegramId === selectedContact.telegramId);
    navigate(conv ? `${ROUTES.CHAT}?conversationId=${conv.id}` : ROUTES.CHAT);
  };

  if (showDeleteConfirm) {
    return (
      <ConfirmModal
        isOpen={true}
        title={t('crm.contact.delete_tooltip', 'Видалити контакт').toUpperCase()}
        message={t('crm.contact.delete_confirm', 'Ви впевнені, що хочете видалити цього контакту?')}
        confirmText={t('common.delete', 'ВИДАЛИТИ').toUpperCase()}
        cancelText={t('common.cancel', 'Скасувати')}
        isDanger
        onConfirm={() => {
          deleteBotUserMut.mutate(selectedContact.id);
          onContactDeleted();
          setShowDeleteConfirm(false);
        }}
        onClose={() => setShowDeleteConfirm(false)}
      />
    );
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0A0A]/50 select-none animate-fade-in cursor-pointer font-['JetBrains_Mono',monospace]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#F2EBDD] rounded-3xl border-2 border-[#0A0A0A] w-full max-w-4xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] cursor-default"
      >
        <div className="w-full md:w-[280px] border-r-2 border-[#0A0A0A] flex flex-col bg-[#F2EBDD] shrink-0">
          <div className="p-6 flex flex-col items-center gap-4 border-b-2 border-[#0A0A0A]">
            <ContactAvatar photoUrl={selectedContact.photoUrl} name={selectedContact.firstName} size="lg" />
            <div className="text-center">
              <h2 className="font-['Anybody',sans-serif] text-lg font-black text-[#0A0A0A] uppercase leading-tight">
                {selectedContact.firstName} {selectedContact.lastName || ''}
              </h2>
              {selectedContact.username && (
                <a
                  href={`https://t.me/${selectedContact.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#0A0A0A]/60 hover:text-[#0A0A0A] transition-all mt-0.5"
                >
                  <Send size={11} className="rotate-45" />
                  @{selectedContact.username}
                  <ExternalLink size={10} />
                </a>
              )}
            </div>
          </div>

          <div className="px-5 py-4 flex flex-col gap-3 border-b-2 border-[#0A0A0A]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isUnsubscribed
                  ? <XCircle size={14} className="text-rose-600 shrink-0" />
                  : <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />}
                <span className="text-xs font-black uppercase text-[#0A0A0A]">
                  {isUnsubscribed ? t('crm.contact.unsubscribed') : t('crm.contact.subscribed')}
                </span>
              </div>
              <button
                onClick={() => handleUpdateContactMetadata({ ...meta, unsubscribed: !isUnsubscribed })}
                className="text-[10px] font-black uppercase px-2 py-0.5 border-2 border-[#0A0A0A] rounded-lg bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-all cursor-pointer"
              >
                {isUnsubscribed ? t('crm.contact.subscribe') : t('crm.contact.unsubscribe')}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black bg-[#0A0A0A] text-[#F2EBDD] px-1.5 py-0.5 rounded font-mono">ID</span>
              <span className="text-xs font-bold text-[#0A0A0A]">{selectedContact.telegramId}</span>
            </div>
          </div>
          <div className="p-4 flex flex-col gap-2 mt-auto">
            <button
              onClick={() => handleUpdateContactMetadata({ ...meta, paused: !isPaused })}
              className={`w-full py-2.5 border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isPaused ? 'bg-emerald-400 text-[#0A0A0A] hover:bg-emerald-500' : 'bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD]'
              }`}
            >
              {isPaused ? <><Play size={13} /><span>{t('crm.contact.resume_automations')}</span></>
                : <><Pause size={13} /><span>{t('crm.contact.pause_automations')}</span></>}
            </button>

            <button
              onClick={handleStartChat}
              className="w-full py-2.5 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageSquare size={13} />
              <span>{t('crm.contact.start_chat')}</span>
            </button>
          </div>
        </div>
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="px-6 py-4 border-b-2 border-[#0A0A0A] flex items-center justify-between shrink-0">
            <span className="font-['Anybody',sans-serif] text-sm font-black text-[#0A0A0A] uppercase tracking-tight">
              {t('crm.contact.details') || 'ДЕТАЛІ'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-8 h-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] bg-white text-rose-600 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all cursor-pointer"
                title={t('crm.contact.delete_tooltip')}
              >
                <Trash2 size={14} />
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-all cursor-pointer shadow-sm"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-['Anybody',sans-serif] text-xs font-black text-[#0A0A0A] uppercase tracking-wider">
                  {t('crm.contact.tags_title')}
                </h3>
                <button
                  onClick={() => setShowAddTagInline(!showAddTagInline)}
                  className="flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 border-2 border-[#0A0A0A] rounded-lg bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-all cursor-pointer"
                >
                  <Plus size={10} />
                  {t('crm.contact.add_tag')}
                </button>
              </div>

              {showAddTagInline && (
                <div className="flex gap-2 max-w-sm w-full">
                  {newTagVal === 'NEW_TAG' ? (
                    <>
                      <input
                        type="text"
                        placeholder={t('crm.contact.custom_tag_placeholder')}
                        value={customTagName}
                        onChange={(e) => setCustomTagName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { handleAddTagInline(customTagName); setCustomTagName(''); } }}
                        className="flex-1 px-3 py-1.5 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-bold focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => { handleAddTagInline(customTagName); setCustomTagName(''); }}
                        className="px-3 py-1.5 bg-[#0A0A0A] text-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase cursor-pointer"
                      >
                        {t('crm.contact.add')}
                      </button>
                      <button
                        onClick={() => { setNewTagVal(''); setCustomTagName(''); }}
                        className="px-3 py-1.5 bg-white text-[#0A0A0A] border-2 border-[#0A0A0A] rounded-xl text-xs font-black cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </>
                  ) : (
                    <div className="w-full">
                      <TagSearchSelect
                        tagName=""
                        tags={tags}
                        assignedTags={selectedContact.tags || []}
                        onChange={(selectedTag: any) => { if (selectedTag) handleAddTagInline(selectedTag.name); }}
                        onCreateTag={() => setNewTagVal('NEW_TAG')}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-1.5">
                {!(selectedContact.tags) || selectedContact.tags.length === 0 ? (
                  <span className="text-xs text-[#0A0A0A]/40 italic font-bold">{t('crm.contact.no_tags')}</span>
                ) : (
                  (selectedContact.tags || []).map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border-2 border-[#0A0A0A] text-[#0A0A0A] text-xs font-black uppercase rounded-xl select-none">
                      <span>{tag}</span>
                      <button
                        onClick={() => handleRemoveTagInline(tag)}
                        className="text-[#0A0A0A]/50 hover:text-rose-600 cursor-pointer transition-all"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </section>
            <div className="border-t-2 border-[#0A0A0A]/10" />

            <section className="space-y-3">
              <h3 className="font-['Anybody',sans-serif] text-xs font-black text-[#0A0A0A] uppercase tracking-wider">
                {t('crm.contact.system_fields')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#0A0A0A]/50 uppercase tracking-wider block">
                    {t('crm.contact.first_name')}
                  </label>
                  <input
                    type="text"
                    defaultValue={selectedContact.firstName}
                    onBlur={(e) => handleUpdateName('first', e.target.value)}
                    className="w-full px-3 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] focus:outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#0A0A0A]/50 uppercase tracking-wider block">
                    {t('crm.contact.last_name')}
                  </label>
                  <input
                    type="text"
                    defaultValue={selectedContact.lastName || ''}
                    onBlur={(e) => handleUpdateName('last', e.target.value)}
                    placeholder={t('crm.contact.not_set')}
                    className="w-full px-3 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] placeholder:text-[#0A0A0A]/30 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </section>

            <div className="border-t-2 border-[#0A0A0A]/10" />
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-['Anybody',sans-serif] text-xs font-black text-[#0A0A0A] uppercase tracking-wider">
                  {t('crm.contact.custom_fields')}
                </h3>
                <button
                  onClick={() => setShowAddCustomFieldInline(!showAddCustomFieldInline)}
                  className="flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 border-2 border-[#0A0A0A] rounded-lg bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-all cursor-pointer"
                >
                  <Plus size={10} />
                  {t('crm.contact.add_custom_field')}
                </button>
              </div>

              {showAddCustomFieldInline && (
                <div className="flex gap-2 items-center bg-white border-2 border-[#0A0A0A] p-3 rounded-2xl">
                  <input
                    type="text"
                    placeholder={t('crm.contact.field_key_placeholder')}
                    value={customFieldName}
                    onChange={(e) => setCustomFieldName(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl text-xs font-bold focus:outline-none"
                    autoFocus
                  />
                  <input
                    type="text"
                    placeholder={t('crm.contact.value_placeholder')}
                    value={customFieldValue}
                    onChange={(e) => setCustomFieldValue(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl text-xs font-bold focus:outline-none"
                  />
                  <button
                    onClick={handleAddCustomFieldInline}
                    className="w-8 h-8 flex items-center justify-center bg-[#0A0A0A] text-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl cursor-pointer hover:bg-[#2A2A2A] transition-all shrink-0"
                  >
                    <Check size={13} />
                  </button>
                </div>
              )}

              <div className="space-y-2">
                {!(meta.customFields) || Object.keys(meta.customFields).length === 0 ? (
                  <span className="text-xs text-[#0A0A0A]/40 italic font-bold">{t('crm.contact.no_custom_fields')}</span>
                ) : (
                  Object.entries(meta.customFields).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between py-2 px-3 bg-white border-2 border-[#0A0A0A] rounded-xl">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-black text-[#0A0A0A]/50 uppercase tracking-wider">{k}</span>
                        <span className="text-xs font-bold text-[#0A0A0A] truncate">{v}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveCustomFieldInline(k)}
                        className="w-7 h-7 flex items-center justify-center text-[#0A0A0A]/40 hover:text-rose-600 hover:bg-rose-50 border-2 border-transparent hover:border-rose-200 rounded-lg transition-all cursor-pointer shrink-0"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
