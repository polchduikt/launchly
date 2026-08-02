import React, { useState, useRef, useEffect } from 'react';
import {
  Tag,
  Clock,
  CheckCircle,
  Eye,
  Pause,
  Play,
  Columns3,
  Plus,
  X,
  CalendarClock,
  Heart,
} from 'lucide-react';
import type { ConversationResponse } from '../../../../types/crm';
import type { BotUserResponse } from '../../../../types/bot';
import { t } from '../../../../i18n/config';

interface ChatToolbarProps {
  conversation: ConversationResponse;
  botUser?: BotUserResponse;
  infoPanelOpen: boolean;
  onToggleInfoPanel: () => void;
  onCloseConversation: () => void;
  onMarkUnread: () => void;
  onPause: (durationMs: number | null) => void;
  onResume: () => void;
  onAddLabel: (label: string) => void;
  onRemoveLabel: (label: string) => void;
  onDeleteGlobalLabel: (label: string) => void;
  onSetReminder: (reminderTime: number | null) => void;
  allLabels: string[];
  isPaused: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  meta: Record<string, unknown>;
}

import { PAUSE_OPTIONS, REMINDER_OPTIONS } from '../../../../const/chat';

export const ChatToolbar: React.FC<ChatToolbarProps> = ({
  conversation,
  botUser: _botUser,
  infoPanelOpen,
  onToggleInfoPanel,
  onCloseConversation,
  onMarkUnread,
  onPause,
  onResume,
  onAddLabel,
  onRemoveLabel,
  onDeleteGlobalLabel,
  onSetReminder,
  allLabels,
  isPaused,
  isFavorite,
  onToggleFavorite,
  meta,
}) => {
  const [openMenu, setOpenMenu] = useState<'labels' | 'reminder' | 'pause' | null>(null);
  const [newLabelInput, setNewLabelInput] = useState('');
  const [showCustomReminder, setShowCustomReminder] = useState(false);
  const [customReminderDate, setCustomReminderDate] = useState('');
  const menuRef = useRef<HTMLDivElement | null>(null);

  const currentLabels: string[] = (() => {
    try {
      const m = meta as { labels?: string[] };
      return m.labels || [];
    } catch {
      return [];
    }
  })();

  const reminderTime = (meta as { reminderTime?: number }).reminderTime;
  const hasActiveReminder = reminderTime && reminderTime > Date.now();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
        setShowCustomReminder(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleMenu = (menu: 'labels' | 'reminder' | 'pause') => {
    setOpenMenu(prev => prev === menu ? null : menu);
    setShowCustomReminder(false);
  };

  const handleAddLabel = () => {
    if (newLabelInput.trim()) {
      onAddLabel(newLabelInput.trim());
      setNewLabelInput('');
    }
  };

  const handleSetReminder = (ms: number) => {
    onSetReminder(Date.now() + ms);
    setOpenMenu(null);
  };

  const handleCustomReminder = () => {
    if (!customReminderDate) return;
    const ts = new Date(customReminderDate).getTime();
    if (!isNaN(ts) && ts > Date.now()) {
      onSetReminder(ts);
      setOpenMenu(null);
      setShowCustomReminder(false);
      setCustomReminderDate('');
    }
  };

  const isClosed = conversation.status === 'CLOSED';

  return (
    <div className="flex items-center gap-1.5 font-['JetBrains_Mono',monospace]" ref={menuRef}>

      <div className="relative">
        <button
          onClick={() => toggleMenu('labels')}
          title="Labels"
          className={`w-8 h-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] cursor-pointer transition-all ${
            openMenu === 'labels'
              ? 'bg-[#0A0A0A] text-[#F2EBDD]'
              : 'bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD]'
          }`}
        >
          <Tag size={15} />
        </button>
        {openMenu === 'labels' && (
          <div className="absolute right-0 top-[calc(100%+6px)] z-40 bg-white border-2 border-[#0A0A0A] rounded-2xl shadow-[4px_4px_0px_0px_#0A0A0A] w-56 py-1">
            <div className="px-3 py-1.5 text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider border-b-2 border-[#0A0A0A] font-['Anybody',sans-serif]">
              {t('crm.toolbar.labels')}
            </div>
            <div className="flex items-center px-3 py-2 hover:bg-[#F2EBDD] border-b-2 border-[#0A0A0A]">
              <label className="flex items-center gap-2 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={isFavorite}
                  onChange={onToggleFavorite}
                  className="w-3.5 h-3.5 rounded border-2 border-[#0A0A0A] text-[#0A0A0A] focus:ring-0"
                />
                <Heart size={12} className={isFavorite ? 'text-rose-600 fill-rose-600' : 'text-[#0A0A0A]'} />
                <span className="text-xs text-[#0A0A0A] font-bold uppercase">{t('crm.sidebar.favorites')}</span>
              </label>
            </div>
            {allLabels.length > 0 && (
              <div className="py-1">
                {allLabels.map(label => (
                  <div key={label} className="flex items-center gap-1 px-3 py-1.5 hover:bg-[#F2EBDD] group">
                    <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={currentLabels.includes(label)}
                        onChange={() => currentLabels.includes(label) ? onRemoveLabel(label) : onAddLabel(label)}
                        className="w-3.5 h-3.5 rounded border-2 border-[#0A0A0A] text-[#0A0A0A] focus:ring-0 shrink-0"
                      />
                      <span className="text-xs text-[#0A0A0A] font-bold uppercase truncate">{label}</span>
                    </label>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteGlobalLabel(label); }}
                      title="Delete label"
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-[#0A0A0A] hover:text-rose-600 cursor-pointer shrink-0 transition-opacity"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
                <div className="border-t-2 border-[#0A0A0A] mt-1" />
              </div>
            )}
            <div className="px-3 py-2 flex items-center gap-1.5">
              <input
                type="text"
                value={newLabelInput}
                onChange={e => setNewLabelInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddLabel()}
                placeholder={t('common.label_name_placeholder')}
                className="flex-1 text-xs border-2 border-[#0A0A0A] rounded-lg px-2 py-1 focus:outline-none bg-white text-[#0A0A0A] font-bold"
                autoFocus
              />
              <button
                onClick={handleAddLabel}
                className="p-1.5 bg-[#0A0A0A] text-[#F2EBDD] border-2 border-[#0A0A0A] rounded-lg cursor-pointer hover:bg-[#2A2A2A]"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => toggleMenu('reminder')}
          title="Reminder"
          className={`w-8 h-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] cursor-pointer transition-all ${
            hasActiveReminder 
              ? 'text-[#0A0A0A] bg-amber-300' 
              : openMenu === 'reminder' 
              ? 'bg-[#0A0A0A] text-[#F2EBDD]' 
              : 'bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD]'
          }`}
        >
          <Clock size={15} />
        </button>
        {openMenu === 'reminder' && (
          <div className="absolute right-0 top-[calc(100%+6px)] z-40 bg-white border-2 border-[#0A0A0A] rounded-2xl shadow-[4px_4px_0px_0px_#0A0A0A] w-52 py-1">
            <div className="px-3 py-1.5 text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider border-b-2 border-[#0A0A0A] font-['Anybody',sans-serif]">
              {t('crm.toolbar.remind_me_in')}
            </div>
            {hasActiveReminder && (
              <button
                onClick={() => { onSetReminder(null); setOpenMenu(null); }}
                className="w-full text-left px-3 py-2 text-xs font-black uppercase text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-b-2 border-[#0A0A0A]"
              >
                <X size={12} /> Clear reminder
              </button>
            )}
            {REMINDER_OPTIONS.map(opt => (
              <button
                key={opt.label}
                onClick={() => handleSetReminder(opt.value)}
                className="w-full text-left px-3 py-2 text-xs text-[#0A0A0A] font-bold uppercase hover:bg-[#F2EBDD] cursor-pointer"
              >
                {opt.label}
              </button>
            ))}
            {!showCustomReminder ? (
              <button
                onClick={() => setShowCustomReminder(true)}
                className="w-full text-left px-3 py-2 text-xs text-[#0A0A0A] font-bold uppercase hover:bg-[#F2EBDD] cursor-pointer flex items-center gap-2 border-t-2 border-[#0A0A0A]"
              >
                <CalendarClock size={13} /> Pick date and time
              </button>
            ) : (
              <div className="px-3 py-2 border-t-2 border-[#0A0A0A] space-y-1.5">
                <input
                  type="datetime-local"
                  value={customReminderDate}
                  onChange={e => setCustomReminderDate(e.target.value)}
                  className="w-full text-xs border-2 border-[#0A0A0A] rounded-lg px-2 py-1 focus:outline-none bg-white text-[#0A0A0A] font-bold"
                  autoFocus
                />
                <button
                  onClick={handleCustomReminder}
                  className="w-full text-xs font-black uppercase text-[#F2EBDD] bg-[#0A0A0A] hover:bg-[#2A2A2A] rounded-lg border-2 border-[#0A0A0A] py-1.5 cursor-pointer"
                >
                  Set reminder
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <button
        onClick={onCloseConversation}
        title={isClosed ? 'Reopen conversation' : 'Close conversation'}
        className={`w-8 h-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] cursor-pointer transition-all ${
          isClosed 
            ? 'text-[#0A0A0A] bg-emerald-300' 
            : 'bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD]'
        }`}
      >
        <CheckCircle size={15} />
      </button>

      <button
        onClick={onMarkUnread}
        title="Mark as unread"
        className="w-8 h-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] cursor-pointer transition-all"
      >
        <Eye size={15} />
      </button>

      <div className="relative">
        <button
          onClick={() => isPaused ? onResume() : toggleMenu('pause')}
          title={isPaused ? 'Resume automation' : 'Pause automation'}
          className={`w-8 h-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] cursor-pointer transition-all ${
            isPaused 
              ? 'text-[#0A0A0A] bg-amber-300' 
              : openMenu === 'pause' 
              ? 'bg-[#0A0A0A] text-[#F2EBDD]' 
              : 'bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD]'
          }`}
        >
          {isPaused ? <Play size={15} /> : <Pause size={15} />}
        </button>
        {openMenu === 'pause' && !isPaused && (
          <div className="absolute right-0 top-[calc(100%+6px)] z-40 bg-white border-2 border-[#0A0A0A] rounded-2xl shadow-[4px_4px_0px_0px_#0A0A0A] w-48 py-1">
            <div className="px-3 py-1.5 text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider border-b-2 border-[#0A0A0A] font-['Anybody',sans-serif]">
              {t('crm.panel.automations.duration.title')}
            </div>
            {PAUSE_OPTIONS.map((opt, i) => (
              <button
                key={i}
                onClick={() => { onPause(opt.value); setOpenMenu(null); }}
                className="w-full text-left px-3 py-2 text-xs font-bold uppercase text-[#0A0A0A] hover:bg-[#F2EBDD] cursor-pointer"
              >
                {t(opt.key)}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onToggleInfoPanel}
        title={infoPanelOpen ? 'Hide contact info' : 'Show contact info'}
        className={`w-8 h-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] cursor-pointer transition-all ${
          infoPanelOpen 
            ? 'bg-[#0A0A0A] text-[#F2EBDD]' 
            : 'bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD]'
        }`}
      >
        <Columns3 size={15} />
      </button>
    </div>
  );
};
