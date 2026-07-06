import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  CheckCircle2,
  Clock,
  Send,
  ExternalLink,
  MessageSquare,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import type { BotUserResponse, BotUserUpdateRequest } from '../../../types/bot';
import { ContactAvatar } from './ContactAvatar';
import { useUpdateBotUserMutation, useDeleteBotUserMutation } from '../hooks/useCrmQueries';
import { ROUTES } from '../../../constants/routes';

import type { ConversationResponse } from '../../../types/crm';
import type { TagResponse } from '../../broadcast/types';

interface BotUserMetadata {
  sequences?: string[];
  paused?: boolean;
  unsubscribed?: boolean;
  customFields?: Record<string, string>;
}

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

  const updateBotUserMut = useUpdateBotUserMutation(botId);
  const deleteBotUserMut = useDeleteBotUserMutation(botId);

  const [showAddTagInline, setShowAddTagInline] = useState(false);
  const [newTagVal, setNewTagVal] = useState('');
  const [showSubscribeSeqInline, setShowSubscribeSeqInline] = useState(false);
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
      {
        userId: selectedContact.id,
        data: {
          metadata: JSON.stringify(updatedMeta),
        },
      },
      {
        onSuccess: (updated) => {
          onContactUpdated(updated);
        },
      }
    );
  };

  const handleAddTagInline = (tagName: string) => {
    if (!tagName.trim()) return;
    const trimmed = tagName.trim();
    if ((selectedContact.tags || []).includes(trimmed)) return;

    updateBotUserMut.mutate(
      {
        userId: selectedContact.id,
        data: {
          tags: [...(selectedContact.tags || []), trimmed],
        },
      },
      {
        onSuccess: (updated) => {
          onContactUpdated(updated);
          setNewTagVal('');
          setShowAddTagInline(false);
        },
      }
    );
  };

  const handleRemoveTagInline = (tagName: string) => {
    updateBotUserMut.mutate(
      {
        userId: selectedContact.id,
        data: {
          tags: (selectedContact.tags || []).filter((t) => t !== tagName),
        },
      },
      {
        onSuccess: (updated) => {
          onContactUpdated(updated);
        },
      }
    );
  };

  const handleSubscribeSequenceInline = (seqId: string) => {
    const seqs = meta.sequences || [];
    if (seqs.includes(seqId)) return;

    handleUpdateContactMetadata({
      ...meta,
      sequences: [...seqs, seqId],
    });
    setShowSubscribeSeqInline(false);
  };

  const handleUnsubscribeSequenceInline = (seqId: string) => {
    const seqs = meta.sequences || [];

    handleUpdateContactMetadata({
      ...meta,
      sequences: seqs.filter((s) => s !== seqId),
    });
  };

  const handleAddCustomFieldInline = () => {
    if (!customFieldName.trim()) return;
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
    setShowAddCustomFieldInline(false);
  };

  const handleRemoveCustomFieldInline = (fieldKey: string) => {
    const fields = meta.customFields || {};
    delete fields[fieldKey];

    handleUpdateContactMetadata({
      ...meta,
      customFields: { ...fields },
    });
  };

  const handleUpdateName = (field: 'first' | 'last', val: string) => {
    const data: BotUserUpdateRequest = {};
    if (field === 'first') {
      if (selectedContact.firstName === val) return;
      data.firstName = val;
    } else {
      if ((selectedContact.lastName || '') === val) return;
      data.lastName = val;
    }

    updateBotUserMut.mutate(
      {
        userId: selectedContact.id,
        data,
      },
      {
        onSuccess: (updated) => {
          onContactUpdated(updated);
        },
      }
    );
  };

  const handleStartChat = () => {
    const conv = conversations.find((c) => c.botUserTelegramId === selectedContact.telegramId);
    if (conv) {
      navigate(`${ROUTES.CHAT}?conversationId=${conv.id}`);
    } else {
      navigate(ROUTES.CHAT);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm select-none animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] border border-slate-100 animate-scale-up">
        
        <div className="w-full md:w-[320px] border-r border-slate-100 p-6 flex flex-col items-center space-y-5 bg-slate-50/50 shrink-0">
          <ContactAvatar photoUrl={selectedContact.photoUrl} name={selectedContact.firstName} size="lg" />

          <button
            onClick={() => handleUpdateContactMetadata({ ...meta, paused: !isPaused })}
            className="w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            {isPaused ? (
              <>
                <Play size={14} className="text-emerald-500" />
                <span>Resume Automations</span>
              </>
            ) : (
              <>
                <Pause size={14} className="text-slate-500" />
                <span>Pause Automations</span>
              </>
            )}
          </button>

          <div className="w-full border-t border-slate-100 pt-4 space-y-3.5 text-xs font-bold text-slate-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className={isUnsubscribed ? 'text-rose-500' : 'text-emerald-500'} />
                <span>{isUnsubscribed ? 'Unsubscribed' : 'Subscribed'}</span>
              </div>
              <button
                onClick={() => handleUpdateContactMetadata({ ...meta, unsubscribed: !isUnsubscribed })}
                className="text-indigo-600 hover:text-indigo-700 underline text-[11px] cursor-pointer"
              >
                {isUnsubscribed ? 'Subscribe' : 'Unsubscribe'}
              </button>
            </div>

            <div className="flex items-center gap-2 text-slate-500">
              <span className="font-mono bg-slate-100 text-[10px] text-slate-500 px-1.5 py-0.5 rounded">ID</span>
              <span>{selectedContact.telegramId}</span>
            </div>

            {selectedContact.username && (
              <a
                href={`https://t.me/${selectedContact.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
              >
                <Send size={14} className="text-indigo-500 rotate-45" />
                <span>@{selectedContact.username}</span>
                <ExternalLink size={11} />
              </a>
            )}
          </div>

          <div className="w-full pt-4">
            <button
              onClick={handleStartChat}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageSquare size={14} />
              <span>Start Chat</span>
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto space-y-6 flex flex-col min-w-0">
          <div className="flex justify-between items-start shrink-0">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {selectedContact.firstName} {selectedContact.lastName || ''}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this contact?')) {
                    deleteBotUserMut.mutate(selectedContact.id);
                    onContactDeleted();
                  }
                }}
                className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                title="Delete Contact"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center select-none">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Contact Tags</span>
              <button
                onClick={() => setShowAddTagInline(!showAddTagInline)}
                className="text-indigo-600 hover:text-indigo-700 text-xs font-bold cursor-pointer"
              >
                + Add Tag
              </button>
            </div>
            
            {showAddTagInline && (
              <div className="flex gap-2 max-w-sm animation-slide-in">
                <select
                  value={newTagVal}
                  onChange={(e) => setNewTagVal(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
                >
                  <option value="">-- Select Tag --</option>
                  {tags.map((t) => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                  <option value="NEW_TAG">+ New Tag (Write custom name below)</option>
                </select>
                {newTagVal === 'NEW_TAG' ? (
                  <input
                    type="text"
                    placeholder="Custom tag name"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddTagInline((e.target as HTMLInputElement).value);
                    }}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
                  />
                ) : (
                  <button
                    onClick={() => handleAddTagInline(newTagVal)}
                    className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 cursor-pointer"
                  >
                    Add
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-1.5">
              {!(selectedContact.tags) || selectedContact.tags.length === 0 ? (
                <span className="text-xs text-slate-400 italic">No tags assigned.</span>
              ) : (
                (selectedContact.tags || []).map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full select-none">
                    <span>{t}</span>
                    <button
                      onClick={() => handleRemoveTagInline(t)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center select-none">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Subscribed to Sequences</span>
              <button
                onClick={() => setShowSubscribeSeqInline(!showSubscribeSeqInline)}
                className="text-indigo-600 hover:text-indigo-700 text-xs font-bold cursor-pointer"
              >
                Subscribe
              </button>
            </div>

            {showSubscribeSeqInline && (
              <div className="flex gap-2 max-w-sm animation-slide-in">
                <select
                  onChange={(e) => handleSubscribeSequenceInline(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>-- Select Sequence --</option>
                  <option value="1">Sequence 1</option>
                </select>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5">
              {!(meta.sequences) || meta.sequences.length === 0 ? (
                <span className="text-xs text-slate-400 italic">No sequence subscriptions.</span>
              ) : (
                meta.sequences.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full select-none">
                    <span>Sequence {s}</span>
                    <button
                      onClick={() => handleUnsubscribeSequenceInline(s)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>



          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block border-b border-slate-100 pb-1">System Fields</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-400 uppercase">First Name</label>
                <input
                  type="text"
                  defaultValue={selectedContact.firstName}
                  onBlur={(e) => handleUpdateName('first', e.target.value)}
                  className="w-full px-3 py-2 bg-blue-50/30 focus:bg-white border border-blue-100 focus:border-indigo-500 rounded-xl text-xs font-bold text-slate-800 focus:outline-none transition-all shadow-sm shadow-blue-50/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-400 uppercase">Last Name</label>
                <input
                  type="text"
                  defaultValue={selectedContact.lastName || ''}
                  onBlur={(e) => handleUpdateName('last', e.target.value)}
                  placeholder="Not Set"
                  className="w-full px-3 py-2 bg-blue-50/30 focus:bg-white border border-blue-100 focus:border-indigo-500 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 placeholder:italic focus:outline-none transition-all shadow-sm shadow-blue-50/20"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center select-none border-b border-slate-100 pb-1">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Custom Fields</span>
              <button
                onClick={() => setShowAddCustomFieldInline(!showAddCustomFieldInline)}
                className="text-indigo-600 hover:text-indigo-700 text-xs font-bold cursor-pointer"
              >
                + Add Custom Field
              </button>
            </div>

            {showAddCustomFieldInline && (
              <div className="flex gap-2 items-center bg-slate-50 p-3 rounded-xl border border-slate-200 animation-slide-in">
                <input
                  type="text"
                  placeholder="Field Key (e.g. Gender)"
                  value={customFieldName}
                  onChange={(e) => setCustomFieldName(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Value (e.g. Male)"
                  value={customFieldValue}
                  onChange={(e) => setCustomFieldValue(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none"
                />
                <button
                  onClick={handleAddCustomFieldInline}
                  className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer"
                >
                  <Check size={14} />
                </button>
              </div>
            )}

            <div className="space-y-2">
              {!(meta.customFields) || Object.keys(meta.customFields).length === 0 ? (
                <span className="text-xs text-slate-400 italic">No custom fields set.</span>
              ) : (
                Object.entries(meta.customFields).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between py-2 px-3 bg-blue-50/20 border border-blue-50 rounded-xl shadow-sm shadow-blue-50/10">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{k}</span>
                      <span className="text-xs font-bold text-slate-800 truncate">{v}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveCustomFieldInline(k)}
                      className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
