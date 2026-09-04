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
  ChevronDown,
} from 'lucide-react';
import type { ConversationResponse, MessageResponse } from '../../../../types/crm';
import type { BotUserResponse } from '../../../../types/bot';
import { UserAvatar } from './UserAvatar';
import { useTagsQuery } from '../../../../hooks/broadcast/useBroadcastQueries';
import { useUpdateBotUserMutation, useDeleteBotUserMutation } from '../../../../hooks/crm/useCrmQueries';
import { createTagApi } from '../../../../api/broadcast';
import { getCustomFieldsApi, saveCustomFieldsApi } from '../../../../api/bot';
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
  const [availableFields, setAvailableFields] = useState<any[]>([]);
  const [isFieldDropdownOpen, setIsFieldDropdownOpen] = useState(false);
  const fieldDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (fieldDropdownRef.current && !fieldDropdownRef.current.contains(e.target as Node)) {
        setIsFieldDropdownOpen(false);
      }
    };
    if (isFieldDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isFieldDropdownOpen]);

  useEffect(() => {
    if (conversation.botId) {
      getCustomFieldsApi(conversation.botId)
        .then((res) => {
          const list = res && Array.isArray(res.fields) ? res.fields : Array.isArray(res) ? res : [];
          setAvailableFields(list);
        })
        .catch(() => {});
    }
  }, [conversation.botId]);

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
      <button onClick={onOpen} className="border-l-2 border-[#0A0A0A] px-2 flex items-center text-[#0A0A0A] bg-[#F2EBDD] hover:bg-white cursor-pointer font-['JetBrains_Mono',monospace]">
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

    if (conversation.botId) {
      createTagApi(conversation.botId, { name: trimmed }).catch(() => {});
    }

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
    const nameTrimmed = customFieldName.trim();
    const fields = meta.customFields || {};

    handleUpdateContactMetadata({
      ...meta,
      customFields: {
        ...fields,
        [nameTrimmed]: customFieldValue,
      },
    });

    if (conversation.botId) {
      getCustomFieldsApi(conversation.botId)
        .then((existing) => {
          const list = existing && Array.isArray(existing.fields) ? existing.fields : Array.isArray(existing) ? existing : [];
          if (!list.some((f: any) => f.name === nameTrimmed)) {
            const updated = [...list, { name: nameTrimmed, type: 'Text', description: '', folder: null }];
            saveCustomFieldsApi(conversation.botId, { fields: updated }).catch(() => {});
          }
        })
        .catch(() => {});
    }

    setCustomFieldName('');
    setCustomFieldValue('');
    setIsFieldDropdownOpen(false);
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
    <div className="w-[280px] border-l-2 border-[#0A0A0A] bg-[#F2EBDD] flex flex-col shrink-0 overflow-y-auto font-['JetBrains_Mono',monospace]" style={{ scrollbarWidth: 'none' }}>
      <div className="flex items-center justify-between px-4 py-3.5 border-b-2 border-[#0A0A0A] shrink-0 bg-[#F2EBDD]">
        <span className="font-['Anybody',sans-serif] font-black text-sm text-[#0A0A0A] uppercase tracking-tight truncate">{conversation.botUserName}</span>
        <div className="flex items-center gap-2 relative" ref={moreMenuRef}>
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="text-[#0A0A0A] hover:bg-white cursor-pointer p-1 rounded-lg border-2 border-transparent hover:border-[#0A0A0A] transition-all"
          >
            <MoreVertical size={16} />
          </button>
          {showMoreMenu && (
            <div className="absolute right-0 top-8 w-56 bg-white border-2 border-[#0A0A0A] rounded-2xl shadow-[4px_4px_0px_0px_#0A0A0A] py-1.5 z-50">
              <button
                onClick={handleUnsubscribeAccount}
                className="w-full text-left px-3 py-2 text-xs font-black uppercase text-[#0A0A0A] hover:bg-[#F2EBDD] transition-all cursor-pointer flex items-center gap-2"
              >
                {t('crm.contact.unsub_acc')}
              </button>
              <button
                onClick={handleUnsubscribeTelegram}
                className="w-full text-left px-3 py-2 text-xs font-black uppercase text-[#0A0A0A] hover:bg-[#F2EBDD] transition-all cursor-pointer flex items-center gap-2"
              >
                {t('crm.contact.unsub_tg')}
              </button>
              <div className="border-t-2 border-[#0A0A0A] my-1" />
              <button
                onClick={handleDeleteContact}
                className="w-full text-left px-3 py-2 text-xs font-black uppercase text-rose-600 hover:bg-rose-50 transition-all cursor-pointer flex items-center gap-2"
              >
                {t('crm.contact.delete_tooltip')}
              </button>
            </div>
          )}
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-all cursor-pointer shadow-sm">
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="flex flex-col items-center px-4 py-6 shrink-0 bg-[#F2EBDD]">
        <UserAvatar name={conversation.botUserName} photoUrl={conversation.botUserPhotoUrl} size={80} className="border-2 border-[#0A0A0A] mb-3" />
        <h3 className="font-['Anybody',sans-serif] font-black text-base text-[#0A0A0A] uppercase tracking-tight text-center">{conversation.botUserName}</h3>
      </div>
      <div className="px-4 space-y-2.5 pb-4 border-b-2 border-[#0A0A0A] text-xs shrink-0 bg-[#F2EBDD]">
        <div className="flex items-center justify-between text-[#0A0A0A]">
          <div className="flex items-center gap-2 font-bold">
            <span className={meta.telegram_opt_in === false ? 'text-rose-600 font-black' : 'text-emerald-600 font-black'}>✓</span>
            <span className="uppercase">{meta.telegram_opt_in === false ? t('crm.panel.status.unsubscribed') : t('crm.panel.status.subscribed')}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[#0A0A0A] font-bold"><Hash size={13} /><span>{conversation.botUserTelegramId}</span></div>
        {conversation.botUserUsername && (
          <div className="flex items-center gap-2 text-[#0A0A0A]">
            <span className="w-4 h-4 rounded-md bg-[#0A0A0A] text-[#F2EBDD] flex items-center justify-center shrink-0 border border-[#0A0A0A]"><Send size={9} /></span>
            <button
              onClick={() => window.open(`https://t.me/${conversation.botUserUsername}`, '_blank')}
              className="font-bold uppercase hover:underline cursor-pointer flex items-center gap-1"
            >
              @{conversation.botUserUsername} <ExternalLink size={10} />
            </button>
          </div>
        )}
      </div>
      <div className="px-4 py-3 border-b-2 border-[#0A0A0A] shrink-0 bg-[#F2EBDD]">
        <button
          onClick={() => setShowHistoryModal(true)}
          className="w-full py-2 border-2 border-[#0A0A0A] bg-white rounded-xl text-xs font-black uppercase text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] cursor-pointer transition-all"
        >
          {t('crm.panel.history_btn')}
        </button>
      </div>
      
      {botUser && (
        <>
          <div className="px-4 py-3 border-b-2 border-[#0A0A0A] shrink-0 relative bg-[#F2EBDD]">
            <div className="flex items-center gap-1 mb-2 font-['Anybody',sans-serif]">
              <h4 className="font-black text-xs text-[#0A0A0A] uppercase tracking-wider">{t('crm.panel.automations_title')}</h4>
              <span className="text-[#0A0A0A] cursor-pointer text-xs font-bold">ⓘ</span>
            </div>
            {isPaused ? (
              <button
                onClick={handleResume}
                className="w-full py-2 border-2 border-[#0A0A0A] bg-white rounded-xl text-xs font-black uppercase text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] cursor-pointer flex items-center justify-center gap-2 transition-all"
              >
                <Play size={14} className="text-emerald-600" />
                <span>{t('crm.panel.automations.resume')}</span>
              </button>
            ) : (
              <div className="relative w-full">
                <button
                  onClick={() => setShowPauseMenu(!showPauseMenu)}
                  className="w-full py-2 border-2 border-[#0A0A0A] bg-white rounded-xl text-xs font-black uppercase text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] cursor-pointer flex items-center justify-center gap-2 transition-all"
                >
                  <Pause size={14} className="text-[#0A0A0A]" />
                  <span>{t('crm.panel.automations.pause')}</span>
                </button>

                {showPauseMenu && (
                  <div className="absolute bottom-[110%] left-0 right-0 z-30 bg-white border-2 border-[#0A0A0A] rounded-2xl shadow-[4px_4px_0px_0px_#0A0A0A] py-1 flex flex-col">
                    <div className="text-[10px] text-[#0A0A0A] font-black px-3 py-1.5 border-b-2 border-[#0A0A0A] uppercase tracking-wider select-none text-left font-['Anybody',sans-serif]">
                      {t('crm.panel.automations.duration.title')}
                    </div>
                    {pauseOptions.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handlePause(opt.value)}
                        className="px-3 py-2 text-left text-xs font-bold uppercase text-[#0A0A0A] hover:bg-[#F2EBDD] transition-colors w-full cursor-pointer"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-b-2 border-[#0A0A0A] shrink-0 bg-[#F2EBDD]">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-['Anybody',sans-serif] font-black text-xs text-[#0A0A0A] uppercase tracking-wider">{t('crm.panel.tags_title')}</h4>
              <button onClick={() => setShowAddTag(!showAddTag)} className="text-[11px] font-black uppercase text-[#0A0A0A] hover:underline cursor-pointer">
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
                      className="flex-1 px-2 py-1 bg-white border-2 border-[#0A0A0A] rounded-lg text-xs font-bold text-[#0A0A0A] focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        handleAddTag(customTagName);
                        setCustomTagName('');
                      }}
                      className="px-2.5 py-1 bg-[#0A0A0A] text-[#F2EBDD] border-2 border-[#0A0A0A] rounded-lg text-xs font-black uppercase hover:bg-[#2A2A2A] cursor-pointer"
                    >
                      {t('crm.panel.tags.add')}
                    </button>
                    <button
                      onClick={() => {
                        setNewTagVal('');
                        setCustomTagName('');
                      }}
                      className="px-2.5 py-1 bg-white text-[#0A0A0A] border-2 border-[#0A0A0A] rounded-lg text-xs font-bold hover:bg-[#F2EBDD] cursor-pointer"
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
                <span className="text-xs text-slate-700 font-bold italic">{t('crm.panel.tags.no_tags')}</span>
              ) : (
                botUser.tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white text-[#0A0A0A] border border-[#0A0A0A] text-[11px] font-bold uppercase rounded-md">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="text-[#0A0A0A] hover:text-rose-600 cursor-pointer"><X size={10} /></button>
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="px-4 py-3 border-b-2 border-[#0A0A0A] shrink-0 space-y-2 bg-[#F2EBDD]">
            <div className="flex items-center justify-between">
              <h4 className="font-['Anybody',sans-serif] font-black text-xs text-[#0A0A0A] uppercase tracking-wider">{t('crm.panel.fields_title')}</h4>
              <button onClick={() => setShowAddCustomField(!showAddCustomField)} className="text-[11px] font-black uppercase text-[#0A0A0A] hover:underline cursor-pointer">
                {t('crm.panel.fields.add_btn')}
              </button>
            </div>
            {showAddCustomField && (
              <div className="flex flex-col gap-2 bg-white p-2.5 rounded-xl border-2 border-[#0A0A0A] text-left">
                {availableFields.length > 0 && (
                  <div className="relative w-full" ref={fieldDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsFieldDropdownOpen(!isFieldDropdownOpen)}
                      className="w-full px-2.5 py-1.5 bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-lg text-xs font-bold text-[#0A0A0A] flex items-center justify-between cursor-pointer focus:outline-none select-none"
                    >
                      <span className="truncate">{customFieldName || t('crm.panel.fields.select_field', 'Оберіть поле')}</span>
                      <ChevronDown size={14} className={`text-[#0A0A0A] transition-transform ${isFieldDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isFieldDropdownOpen && (
                      <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] rounded-xl overflow-hidden py-1 text-left max-h-40 overflow-y-auto animate-in fade-in duration-100 font-['JetBrains_Mono',monospace]">
                        {availableFields.map((f: any) => {
                          const fname = typeof f === 'string' ? f : f.name;
                          const fval = typeof f === 'object' ? f.value : undefined;
                          return (
                            <button
                              key={fname}
                              type="button"
                              onClick={() => {
                                setCustomFieldName(fname);
                                if (fval !== undefined) setCustomFieldValue(fval);
                                setIsFieldDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-1.5 text-xs font-bold text-left cursor-pointer transition-colors ${
                                customFieldName === fname
                                  ? 'bg-[#0A0A0A] text-[#F2EBDD]'
                                  : 'text-[#0A0A0A] hover:bg-white'
                              }`}
                            >
                              {fname}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                <div className="flex gap-1.5 items-center">
                  <input
                    type="text"
                    placeholder={t('crm.panel.fields.placeholder_key', 'Ключ')}
                    value={customFieldName}
                    onChange={(e) => setCustomFieldName(e.target.value)}
                    className="flex-1 min-w-0 px-2 py-1 bg-white border-2 border-[#0A0A0A] rounded-lg text-xs font-bold text-[#0A0A0A] focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder={t('crm.panel.fields.placeholder_val', 'Значення')}
                    value={customFieldValue}
                    onChange={(e) => setCustomFieldValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomField()}
                    className="flex-1 min-w-0 px-2 py-1 bg-white border-2 border-[#0A0A0A] rounded-lg text-xs font-bold text-[#0A0A0A] focus:outline-none"
                  />
                  <button
                    onClick={handleAddCustomField}
                    disabled={!customFieldName.trim()}
                    className="p-1.5 bg-[#0A0A0A] text-[#F2EBDD] border-2 border-[#0A0A0A] rounded-lg cursor-pointer hover:bg-[#2A2A2A] disabled:opacity-40 shrink-0"
                  >
                    <Check size={12} />
                  </button>
                </div>
              </div>
            )}
            <div className="space-y-1.5 max-h-[180px] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              {!(meta.customFields) || Object.keys(meta.customFields).length === 0 ? (
                <span className="text-xs text-slate-700 font-bold italic">{t('crm.panel.fields.no_fields')}</span>
              ) : (
                Object.entries(meta.customFields).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between py-1.5 px-2.5 bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[2px_2px_0px_0px_#0A0A0A]">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] font-black text-[#0A0A0A] uppercase tracking-wider">{k}</span>
                      <span className="text-xs font-bold text-slate-800 truncate">{v}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveCustomField(k)}
                      className="p-0.5 text-[#0A0A0A] hover:text-rose-600 rounded transition-all cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {noteMessages.length > 0 && (
            <div className="px-4 py-3 border-b-2 border-[#0A0A0A] shrink-0 space-y-2 bg-[#F2EBDD]">
              <h4 className="font-['Anybody',sans-serif] font-black text-xs text-[#0A0A0A] uppercase tracking-wider">{t('crm.panel.notes_title')}</h4>
              <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar" style={{ scrollbarWidth: 'none' }}>
                {noteMessages.map((note) => {
                  const date = new Date(note.createdAt);
                  const formattedDate = `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;
                  return (
                    <div
                      key={note.id}
                      onClick={() => onScrollToNote?.(note.id)}
                      className="p-2.5 bg-amber-200 border-2 border-[#0A0A0A] rounded-xl hover:bg-amber-300 transition-all cursor-pointer space-y-1 shadow-[2px_2px_0px_0px_#0A0A0A]"
                    >
                      <p className="text-xs text-[#0A0A0A] font-bold leading-relaxed break-words whitespace-pre-wrap">{note.content}</p>
                      <div className="text-[10px] text-[#0A0A0A] font-black uppercase opacity-70">{formattedDate}</div>
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
