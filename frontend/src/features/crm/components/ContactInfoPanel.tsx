import React from 'react';
import {
  Clock,
  Hash,
  Send,
  ExternalLink,
  Pause,
  Plus,
  X,
  MoreVertical,
  Users,
} from 'lucide-react';
import type { ConversationResponse } from '../../../types/crm';
import { UserAvatar } from './UserAvatar';

interface ContactInfoPanelProps {
  conversation: ConversationResponse;
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  contactTags: string[];
  showAddTag: boolean;
  onShowAddTag: (show: boolean) => void;
  newTagName: string;
  onNewTagNameChange: (name: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
}

export const ContactInfoPanel: React.FC<ContactInfoPanelProps> = ({
  conversation,
  isOpen,
  onClose,
  onOpen,
  contactTags,
  showAddTag,
  onShowAddTag,
  newTagName,
  onNewTagNameChange,
  onAddTag,
  onRemoveTag,
}) => {
  if (!isOpen) {
    return (
      <button onClick={onOpen} className="border-l border-slate-200 px-2 flex items-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer">
        <Users size={16} />
      </button>
    );
  }

  return (
    <div className="w-[280px] border-l border-slate-200 bg-white flex flex-col shrink-0 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 shrink-0">
        <span className="font-bold text-sm text-slate-800">{conversation.botUserName}</span>
        <div className="flex items-center gap-2">
          <button className="text-slate-400 hover:text-slate-600 cursor-pointer"><MoreVertical size={16} /></button>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={16} /></button>
        </div>
      </div>
      <div className="flex flex-col items-center px-4 py-6 shrink-0">
        <UserAvatar name={conversation.botUserName} photoUrl={conversation.botUserPhotoUrl} size={80} className="shadow-lg mb-3" />
        <h3 className="font-bold text-base text-slate-800">{conversation.botUserName}</h3>
      </div>
      <div className="px-4 space-y-2.5 pb-4 border-b border-slate-100 text-[12px] shrink-0">
        <div className="flex items-center gap-2 text-slate-600"><span className="text-green-500">✓</span><span>Subscribed <span className="text-indigo-500 cursor-pointer hover:underline">(Unsubscribe)</span></span></div>
        <div className="flex items-center gap-2 text-slate-500"><Clock size={13} /><span>Contact Time: {conversation.updatedAt ? new Date(conversation.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown'}</span></div>
        <div className="flex items-center gap-2 text-slate-600"><Hash size={13} /><span>{conversation.botUserTelegramId}</span></div>
        <div className="flex items-center gap-2 text-slate-500"><Send size={13} /><span>Opted-in for Telegram</span></div>
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
        <button className="w-full py-1.5 border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">All Channels History</button>
      </div>
      <div className="px-4 py-3 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-1 mb-2"><h4 className="font-bold text-[13px] text-slate-800">Automations</h4><span className="text-slate-400 cursor-pointer text-xs">ⓘ</span></div>
        <button className="w-full py-2 border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer flex items-center justify-center gap-2"><Pause size={14} /> Pause</button>
      </div>
      <div className="px-4 py-3 border-b border-slate-100 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-[13px] text-slate-800">Contact Tags</h4>
          <button onClick={() => onShowAddTag(true)} className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer">+ Add Tag</button>
        </div>
        {showAddTag && (
          <div className="flex gap-1 mb-2">
            <input value={newTagName} onChange={e => onNewTagNameChange(e.target.value)} onKeyDown={e => e.key === 'Enter' && onAddTag()} placeholder="Tag name" autoFocus className="flex-1 text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-indigo-400" />
            <button onClick={onAddTag} className="text-indigo-600 cursor-pointer"><Plus size={14} /></button>
            <button onClick={() => { onShowAddTag(false); onNewTagNameChange(''); }} className="text-slate-400 cursor-pointer"><X size={14} /></button>
          </div>
        )}
        <div className="flex flex-wrap gap-1">
          {contactTags.map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-medium rounded-md">
              {tag}
              <button onClick={() => onRemoveTag(tag)} className="text-slate-400 hover:text-red-500 cursor-pointer"><X size={10} /></button>
            </span>
          ))}
        </div>
      </div>
      <div className="px-4 py-3 border-b border-slate-100 shrink-0">
        <h4 className="font-bold text-[13px] text-slate-800 mb-1">Subscribed to Sequences</h4>
        <button className="text-[12px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer">Subscribe</button>
      </div>
      <div className="px-4 py-3 border-b border-slate-100 shrink-0">
        <h4 className="font-bold text-[13px] text-slate-800 mb-2">Opted In through</h4>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 text-[12px] font-medium rounded-lg border border-slate-200"><Send size={11} className="text-[#0088cc]" /> Telegram</span>
      </div>
      <div className="px-4 py-3 border-b border-slate-100 shrink-0">
        <h4 className="font-bold text-[13px] text-slate-800 mb-3">System Fields</h4>
        <div className="space-y-2">
          <div><label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">First Name:</label><input defaultValue={conversation.botUserName.split(' ')[0] || ''} className="w-full mt-0.5 text-[13px] text-slate-700 bg-indigo-50/50 border border-indigo-100 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-indigo-300" readOnly /></div>
          <div><label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Last Name:</label><input defaultValue={conversation.botUserName.split(' ').slice(1).join(' ') || ''} placeholder="Not Set" className="w-full mt-0.5 text-[13px] text-slate-400 bg-slate-50 border border-slate-100 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-indigo-300 placeholder:italic" readOnly /></div>
        </div>
      </div>
      <div className="px-4 py-3 shrink-0">
        <h4 className="font-bold text-[13px] text-slate-800 mb-1">Custom Fields</h4>
        <button className="text-[12px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer">Manage Custom Fields</button>
      </div>
    </div>
  );
};
