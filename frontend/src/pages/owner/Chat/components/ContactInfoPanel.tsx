import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../../../../i18n/config';
import {
  Hash,
  Send,
  ExternalLink,
  Pause,
  Play,
  X,
  MoreVertical,
  Users,
  Check,
} from 'lucide-react';
import type { ConversationResponse, MessageResponse } from '../../../../types/crm';
import type { BotUserResponse } from '../../../../types/bot';
import { UserAvatar } from './UserAvatar';
import { useTagsQuery } from '../../../../hooks/broadcast/useBroadcastQueries';
import { useUpdateBotUserMutation, useDeleteBotUserMutation } from '../../../../hooks/crm/useCrmQueries';
import { TagSearchSelect } from '../../FlowBuilder/components/sidebar/editors/TagSearchSelect';
import { ChatHistoryModal } from './ChatHistoryModal';
import { ConfirmActionModal } from './ConfirmActionModal';

import type { BotUserMetadata } from '../../../../types/crm';

interface ContactInfoPanelProps {
  botId: number;
  conversation: ConversationResponse;
  botUser?: BotUserResponse;
  messages?: MessageResponse[];
  onScrollToNote?: (noteId: number) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export const ContactInfoPanel: React.FC<ContactInfoPanelProps> = ({
  botId,
  conversation,
  botUser,
  messages = [],
  onScrollToNote,
  isOpen,
  onClose,
  onOpen,
}) => {
  const { data: tags = [] } = useTagsQuery(botId);
  const updateBotUserMut = useUpdateBotUserMutation(botId);
  const deleteBotUserMut = useDeleteBotUserMutation(botId);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { t } = useTranslation();

  type ActiveConfirmAction = 'unsubscribe_account' | 'unsubscribe_telegram' | 'delete_contact' | null;
  const [activeConfirm, setActiveConfirm] = useState<ActiveConfirmAction>(null);

  const handleUnsubscribeAccount = () => {
    if (!botUser) return;
    setActiveConfirm('unsubscribe_account');
  };

  const handleUnsubscribeTelegram = () => {
    if (!botUser) return;
    setActiveConfirm('unsubscribe_telegram');
  };

  const handleDeleteContact = () => {
    if (!botUser) return;
    setActiveConfirm('delete_contact');
  };

  const handleConfirmAction = () => {
    if (!botUser || !activeConfirm) return;

    if (activeConfirm === 'unsubscribe_telegram') {
      handleUpdateContactMetadata({
        ...meta,
        telegram_opt_in: false,
      });
      setActiveConfirm(null);
      setShowMoreMenu(false);
    } else {
      deleteBotUserMut.mutate(botUser.id, {
        onSuccess: () => {
          setActiveConfirm(null);
          setShowMoreMenu(false);
          onClose();
        },
      });
    }
  };

  const [showAddTag, setShowAddTag] = useState(false);
  const [newTagVal, setNewTagVal] = useState('');
  const [customTagName, setCustomTagName] = useState('');
  const [showAddCustomField, setShowAddCustomField] = useState(false);
  const [customFieldName, setCustomFieldName] = useState('');
  const [customFieldValue, setCustomFieldValue] = useState('');

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPauseMenu, setShowPauseMenu] = useState(false);

  const pauseOptions = [
    { label: t('crm.panel.automations.duration.30m'), value: 30 * 60 * 1000 },
    { label: t('crm.panel.automations.duration.1h'), value: 60 * 60 * 1000 },
    { label: t('crm.panel.automations.duration.3h'), value: 3 * 60 * 60 * 1000 },
    { label: t('crm.panel.automations.duration.6h'), value: 6 * 60 * 60 * 1000 },
    { label: t('crm.panel.automations.duration.12h'), value: 12 * 60 * 60 * 1000 },
    { label: t('crm.panel.automations.duration.1d'), value: 24 * 60 * 60 * 1000 },
    { label: t('crm.panel.automations.duration.forever'), value: null },
  ];

  const handlePause = (durationMs: number | null) => {
    const pausedUntil = durationMs ? Date.now() + durationMs : null;
    handleUpdateContactMetadata({ ...meta, paused: true, pausedUntil });
    setShowPauseMenu(false);
  };

  const handleResume = () => {
    handleUpdateContactMetadata({ ...meta, paused: false, pausedUntil: null });
  };

  if (!isOpen) {
    return (
      <button onClick={onOpen} className="border-l border-slate-200 px-2 flex items-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer">
        <Users size={16} />
      </button>
    );
  }

  const meta: BotUserMetadata = botUser ? (() => {
    try {
      return botUser.metadata ? JSON.parse(botUser.metadata) : {};
    } catch {
      return {};
    }
  })() : {};

  const isPaused = meta.paused;

  const handleUpdateContactMetadata = (updatedMeta: BotUserMetadata) => {
    if (!botUser) return;
    updateBotUserMut.mutate({
      userId: botUser.id,
      data: {
        metadata: JSON.stringify(updatedMeta),
      },
    });
  };

  const handleAddTag = (tagName: string) => {
    if (!botUser || !tagName.trim()) return;
    const trimmed = tagName.trim();
    if ((botUser.tags || []).includes(trimmed)) return;

    updateBotUserMut.mutate({
      userId: botUser.id,
      data: {
        tags: [...(botUser.tags || []), trimmed],
      },
    }, {
      onSuccess: () => {
        setNewTagVal('');
        setShowAddTag(false);
      }
    });
  };

  const handleRemoveTag = (tagName: string) => {
    if (!botUser) return;
    updateBotUserMut.mutate({
      userId: botUser.id,
      data: {
        tags: (botUser.tags || []).filter(t => t !== tagName),
      },
    });
  };

  const handleAddCustomField = () => {
    if (!botUser || !customFieldName.trim()) return;
    const fields = meta.customFields || {};

    handleUpdateContactMetadata({
      ...meta,
      customFields: {
        ...fields,
        [customFieldName.trim()]: customFieldValue,
      },
    });

    setCustomFieldName('');
    setCustomFieldValue('');
    setShowAddCustomField(false);
  };

  const handleRemoveCustomField = (fieldKey: string) => {
    if (!botUser) return;
    const fields = { ...(meta.customFields || {}) };
    delete (fields as Record<string, any>)[fieldKey];

    handleUpdateContactMetadata({
      ...meta,
      customFields: { ...fields },
    });
  };

  const noteMessages = messages.filter(m => m.senderType === 'NOTE');

  return (
    <div className="w-[280px] border-l border-slate-200 bg-white flex flex-col shrink-0 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 shrink-0">
        <span className="font-bold text-sm text-slate-800">{conversation.botUserName}</span>
        <div className="flex items-center gap-2 relative" ref={moreMenuRef}>
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded hover:bg-slate-50 transition-all"
          >
            <MoreVertical size={16} />
          </button>
          {showMoreMenu && (
            <div className="absolute right-0 top-8 w-56 bg-white border border-slate-100 rounded-xl shadow-lg py-1.5 z-50 animate-fade-in-down">
              <button
                onClick={handleUnsubscribeAccount}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-all cursor-pointer flex items-center gap-2"
              >
                {t('crm.contact.unsub_acc')}
              </button>
              <button
                onClick={handleUnsubscribeTelegram}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-all cursor-pointer flex items-center gap-2"
              >
                {t('crm.contact.unsub_tg')}
              </button>
              <div className="border-t border-slate-100 my-1" />
              <button
                onClick={handleDeleteContact}
                className="w-full text-left px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all cursor-pointer flex items-center gap-2"
              >
                {t('crm.contact.delete_tooltip')}
              </button>
            </div>
          )}
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded hover:bg-slate-50 transition-all">
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="flex flex-col items-center px-4 py-6 shrink-0">
        <UserAvatar name={conversation.botUserName} photoUrl={conversation.botUserPhotoUrl} size={80} className="shadow-lg mb-3" />
        <h3 className="font-bold text-base text-slate-800">{conversation.botUserName}</h3>
      </div>
      <div className="px-4 space-y-2.5 pb-4 border-b border-slate-100 text-[12px] shrink-0">
        <div className="flex items-center justify-between text-slate-600">
          <div className="flex items-center gap-2">
            <span className={meta.telegram_opt_in === false ? 'text-rose-500' : 'text-emerald-500'}>✓</span>
            <span>{meta.telegram_opt_in === false ? t('crm.panel.status.unsubscribed') : t('crm.panel.status.subscribed')}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-600"><Hash size={13} /><span>{conversation.botUserTelegramId}</span></div>
        {conversation.botUserUsername && (
          <div className="flex items-center gap-2 text-indigo-600">
            <span className="w-3.5 h-3.5 rounded-full bg-[#0088cc] flex items-center justify-center shrink-0"><Send size={8} className="text-white" /></span>
            <button
              onClick={() => window.open(`https://t.me/${conversation.botUserUsername}`, '_blank')}
              className="font-medium hover:underline cursor-pointer flex items-center gap-1"
            >
              @{conversation.botUserUsername} <ExternalLink size={10} />
            </button>
          </div>
        )}
      </div>
      <div className="px-4 py-3 border-b border-slate-100 shrink-0">
        <button
          onClick={() => setShowHistoryModal(true)}
          className="w-full py-1.5 border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
        >
          {t('crm.panel.history_btn')}
        </button>
      </div>
      
      {botUser && (
        <>
          <div className="px-4 py-3 border-b border-slate-100 shrink-0 relative">
            <div className="flex items-center gap-1 mb-2">
              <h4 className="font-bold text-[13px] text-slate-800">{t('crm.panel.automations_title')}</h4>
              <span className="text-slate-400 cursor-pointer text-xs">ⓘ</span>
            </div>
            {isPaused ? (
              <button
                onClick={handleResume}
                className="w-full py-2 border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <Play size={14} className="text-emerald-500" />
                <span>{t('crm.panel.automations.resume')}</span>
              </button>
            ) : (
              <div className="relative w-full">
                <button
                  onClick={() => setShowPauseMenu(!showPauseMenu)}
                  className="w-full py-2 border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Pause size={14} className="text-slate-500" />
                  <span>{t('crm.panel.automations.pause')}</span>
                </button>

                {showPauseMenu && (
                  <div className="absolute bottom-[110%] left-0 right-0 z-30 bg-white border border-slate-200 rounded-xl shadow-xl py-1 flex flex-col transition-all">
                    <div className="text-[10px] text-slate-400 font-bold px-3 py-1.5 border-b border-slate-100 uppercase tracking-wider select-none text-left">
                      {t('crm.panel.automations.duration.title')}
                    </div>
                    {pauseOptions.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handlePause(opt.value)}
                        className="px-3 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-indigo-50/50 hover:text-indigo-600 transition-colors w-full cursor-pointer"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-b border-slate-100 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-[13px] text-slate-800">{t('crm.panel.tags_title')}</h4>
              <button onClick={() => setShowAddTag(!showAddTag)} className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer">
                {t('crm.panel.tags.add_btn')}
              </button>
            </div>
            {showAddTag && (
              <div className="flex flex-col gap-1.5 mb-2.5">
                {newTagVal === 'NEW_TAG' ? (
                  <div className="flex gap-1.5 w-full">
                    <input
                      type="text"
                      placeholder={t('crm.panel.tags.placeholder_name')}
                      value={customTagName}
                      onChange={(e) => setCustomTagName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddTag(customTagName);
                          setCustomTagName('');
                        }
                      }}
                      className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        handleAddTag(customTagName);
                        setCustomTagName('');
                      }}
                      className="px-2.5 py-1 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700 cursor-pointer"
                    >
                      {t('crm.panel.tags.add')}
                    </button>
                    <button
                      onClick={() => {
                        setNewTagVal('');
                        setCustomTagName('');
                      }}
                      className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded text-xs font-semibold hover:bg-slate-200 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="w-full">
                    <TagSearchSelect
                      tagName=""
                      tags={tags}
                      assignedTags={botUser?.tags || []}
                      onChange={(selectedTag: any) => {
                        if (selectedTag) {
                          handleAddTag(selectedTag.name);
                        }
                      }}
                      onCreateTag={() => {
                        setNewTagVal('NEW_TAG');
                      }}
                    />
                  </div>
                )}
              </div>
            )}
            <div className="flex flex-wrap gap-1">
              {!(botUser.tags) || botUser.tags.length === 0 ? (
                <span className="text-xs text-slate-400 italic">{t('crm.panel.tags.no_tags')}</span>
              ) : (
                botUser.tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-semibold rounded-md">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="text-slate-400 hover:text-red-500 cursor-pointer"><X size={10} /></button>
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="px-4 py-3 border-b border-slate-100 shrink-0 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-[13px] text-slate-800">{t('crm.panel.fields_title')}</h4>
              <button onClick={() => setShowAddCustomField(!showAddCustomField)} className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer">
                {t('crm.panel.fields.add_btn')}
              </button>
            </div>
            {showAddCustomField && (
              <div className="flex gap-1.5 items-center bg-slate-50 p-2 rounded border border-slate-200">
                <input
                  type="text"
                  placeholder={t('crm.panel.fields.placeholder_key')}
                  value={customFieldName}
                  onChange={(e) => setCustomFieldName(e.target.value)}
                  className="flex-1 min-w-0 px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:outline-none"
                />
                <input
                  type="text"
                  placeholder={t('crm.panel.fields.placeholder_val')}
                  value={customFieldValue}
                  onChange={(e) => setCustomFieldValue(e.target.value)}
                  className="flex-1 min-w-0 px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:outline-none"
                />
                <button
                  onClick={handleAddCustomField}
                  className="p-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded cursor-pointer"
                >
                  <Check size={12} />
                </button>
              </div>
            )}
            <div className="space-y-1.5 max-h-[180px] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              {!(meta.customFields) || Object.keys(meta.customFields).length === 0 ? (
                <span className="text-xs text-slate-400 italic">{t('crm.panel.fields.no_fields')}</span>
              ) : (
                Object.entries(meta.customFields).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between py-1.5 px-2 bg-blue-50/20 border border-blue-50 rounded shadow-sm">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">{k}</span>
                      <span className="text-xs font-semibold text-slate-700 truncate">{v}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveCustomField(k)}
                      className="p-0.5 text-slate-400 hover:text-rose-500 rounded transition-all cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {noteMessages.length > 0 && (
            <div className="px-4 py-3 border-b border-slate-100 shrink-0 space-y-2">
              <h4 className="font-bold text-[13px] text-slate-800">{t('crm.panel.notes_title')}</h4>
              <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar" style={{ scrollbarWidth: 'none' }}>
                {noteMessages.map((note) => {
                  const date = new Date(note.createdAt);
                  const formattedDate = `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;
                  return (
                    <div
                      key={note.id}
                      onClick={() => onScrollToNote?.(note.id)}
                      className="p-2.5 bg-amber-50/70 border border-amber-100/60 rounded-xl hover:bg-amber-100/50 active:bg-amber-100 transition-all cursor-pointer space-y-1 animate-fade-in"
                    >
                      <p className="text-xs text-slate-700 font-medium leading-relaxed break-words whitespace-pre-wrap">{note.content}</p>
                      <div className="text-[10px] text-slate-400 font-semibold">{formattedDate}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
      {showHistoryModal && (
        <ChatHistoryModal
          conversation={conversation}
          onClose={() => setShowHistoryModal(false)}
        />
      )}
      <ConfirmActionModal
        isOpen={activeConfirm !== null}
        onClose={() => setActiveConfirm(null)}
        onConfirm={handleConfirmAction}
        isLoading={deleteBotUserMut.isPending || updateBotUserMut.isPending}
        isDanger={activeConfirm === 'delete_contact' || activeConfirm === 'unsubscribe_account'}
        title={
          activeConfirm === 'unsubscribe_account'
            ? t('crm.contact.unsub_acc')
            : activeConfirm === 'unsubscribe_telegram'
            ? t('crm.contact.unsub_tg')
            : t('crm.contact.delete_tooltip')
        }
        message={
          activeConfirm === 'unsubscribe_account'
            ? t('crm.contact.confirm_unsub_acc_msg')
            : activeConfirm === 'unsubscribe_telegram'
            ? t('crm.contact.confirm_unsub_tg_msg')
            : t('crm.contact.confirm_delete_msg')
        }
        confirmText={
          activeConfirm === 'delete_contact'
            ? t('crm.contacts.bulk.delete')
            : t('crm.contact.unsubscribe')
        }
        cancelText={t('crm.contacts.bulk.btn_cancel')}
      />
    </div>
  );
};
