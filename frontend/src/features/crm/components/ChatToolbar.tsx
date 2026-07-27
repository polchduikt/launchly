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
import type { ConversationResponse } from '../../../types/crm';
import type { BotUserResponse } from '../../../types/bot';
import { t } from '../../../i18n/config';

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

const PAUSE_OPTIONS = [
  { key: 'crm.panel.automations.duration.30m', value: 30 * 60 * 1000 },
  { key: 'crm.panel.automations.duration.1h', value: 60 * 60 * 1000 },
  { key: 'crm.panel.automations.duration.3h', value: 3 * 60 * 60 * 1000 },
  { key: 'crm.panel.automations.duration.6h', value: 6 * 60 * 60 * 1000 },
  { key: 'crm.panel.automations.duration.12h', value: 12 * 60 * 60 * 1000 },
  { key: 'crm.panel.automations.duration.1d', value: 24 * 60 * 60 * 1000 },
  { key: 'crm.panel.automations.duration.forever', value: null },
];

const REMINDER_OPTIONS = [
  { label: '20 minutes', value: 20 * 60 * 1000 },
  { label: '1 hour', value: 60 * 60 * 1000 },
  { label: '6 hours', value: 6 * 60 * 60 * 1000 },
  { label: '12 hours', value: 12 * 60 * 60 * 1000 },
];

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
    <div className="flex items-center gap-1" ref={menuRef}>

      <div className="relative">
        <button
          onClick={() => toggleMenu('labels')}
          title="Labels"
          className={`w-8 h-8 flex items-center justify-center rounded-md cursor-pointer transition-all ${openMenu === 'labels' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
        >
          <Tag size={15} />
        </button>
        {openMenu === 'labels' && (
          <div className="absolute right-0 top-[calc(100%+6px)] z-40 bg-white border border-slate-200 rounded-xl shadow-xl w-56 py-1 animate-fade-in">
            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
              {t('crm.toolbar.labels')}
            </div>
            <div className="flex items-center px-3 py-2 hover:bg-slate-50 border-b border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={isFavorite}
                  onChange={onToggleFavorite}
                  className="w-3.5 h-3.5 rounded border-slate-300 accent-indigo-600"
                />
                <Heart size={12} className={isFavorite ? 'text-red-500 fill-red-500' : 'text-slate-400'} />
                <span className="text-xs text-slate-700 font-medium">{t('crm.sidebar.favorites')}</span>
              </label>
            </div>
            {allLabels.length > 0 && (
              <div className="py-1">
                {allLabels.map(label => (
                  <div key={label} className="flex items-center gap-1 px-3 py-1.5 hover:bg-slate-50 group">
                    <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={currentLabels.includes(label)}
                        onChange={() => currentLabels.includes(label) ? onRemoveLabel(label) : onAddLabel(label)}
                        className="w-3.5 h-3.5 rounded border-slate-300 accent-indigo-600 shrink-0"
                      />
                      <span className="text-xs text-slate-700 font-medium truncate">{label}</span>
                    </label>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteGlobalLabel(label); }}
                      title="Delete label"
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-300 hover:text-red-400 cursor-pointer shrink-0 transition-opacity"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
                <div className="border-t border-slate-100 mt-1" />
              </div>
            )}
            <div className="px-3 py-2 flex items-center gap-1.5">
              <input
                type="text"
                value={newLabelInput}
                onChange={e => setNewLabelInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddLabel()}
                placeholder={t('common.label_name_placeholder')}
                className="flex-1 text-xs border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:border-indigo-400"
                autoFocus
              />
              <button
                onClick={handleAddLabel}
                className="p-1 text-indigo-600 hover:text-indigo-800 cursor-pointer"
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
          className={`w-8 h-8 flex items-center justify-center rounded-md cursor-pointer transition-all ${hasActiveReminder ? 'text-amber-500 bg-amber-50' : openMenu === 'reminder' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
        >
          <Clock size={15} />
        </button>
        {openMenu === 'reminder' && (
          <div className="absolute right-0 top-[calc(100%+6px)] z-40 bg-white border border-slate-200 rounded-xl shadow-xl w-52 py-1 animate-fade-in">
            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
              {t('crm.toolbar.remind_me_in')}
            </div>
            {hasActiveReminder && (
              <button
                onClick={() => { onSetReminder(null); setOpenMenu(null); }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 flex items-center gap-2 border-b border-slate-100"
              >
                <X size={12} /> Clear reminder
              </button>
            )}
            {REMINDER_OPTIONS.map(opt => (
              <button
                key={opt.label}
                onClick={() => handleSetReminder(opt.value)}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 font-medium hover:bg-indigo-50/50 hover:text-indigo-600 cursor-pointer"
              >
                {opt.label}
              </button>
            ))}
            {!showCustomReminder ? (
              <button
                onClick={() => setShowCustomReminder(true)}
                className="w-full text-left px-3 py-2 text-xs text-slate-500 font-medium hover:bg-slate-50 cursor-pointer flex items-center gap-2 border-t border-slate-100"
              >
                <CalendarClock size={13} /> Pick date and time
              </button>
            ) : (
              <div className="px-3 py-2 border-t border-slate-100 space-y-1.5">
                <input
                  type="datetime-local"
                  value={customReminderDate}
                  onChange={e => setCustomReminderDate(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:border-indigo-400"
                  autoFocus
                />
                <button
                  onClick={handleCustomReminder}
                  className="w-full text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md py-1.5 cursor-pointer"
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
        className={`w-8 h-8 flex items-center justify-center rounded-md cursor-pointer transition-all ${isClosed ? 'text-emerald-500 bg-emerald-50 hover:bg-emerald-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
      >
        <CheckCircle size={15} />
      </button>

      <button
        onClick={onMarkUnread}
        title="Mark as unread"
        className="w-8 h-8 flex items-center justify-center rounded-md cursor-pointer transition-all text-slate-400 hover:text-slate-600 hover:bg-slate-50"
      >
        <Eye size={15} />
      </button>
      <div className="relative">
        <button
          onClick={() => isPaused ? onResume() : toggleMenu('pause')}
          title={isPaused ? 'Resume automation' : 'Pause automation'}
          className={`w-8 h-8 flex items-center justify-center rounded-md cursor-pointer transition-all ${isPaused ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' : openMenu === 'pause' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
        >
          {isPaused ? <Play size={15} /> : <Pause size={15} />}
        </button>
        {openMenu === 'pause' && !isPaused && (
          <div className="absolute right-0 top-[calc(100%+6px)] z-40 bg-white border border-slate-200 rounded-xl shadow-xl w-48 py-1 animate-fade-in">
            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
              {t('crm.panel.automations.duration.title')}
            </div>
            {PAUSE_OPTIONS.map((opt, i) => (
              <button
                key={i}
                onClick={() => { onPause(opt.value); setOpenMenu(null); }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-indigo-50/50 hover:text-indigo-600 cursor-pointer"
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
        className={`w-8 h-8 flex items-center justify-center rounded-md cursor-pointer transition-all ${infoPanelOpen ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
      >
        <Columns3 size={15} />
      </button>
    </div>
  );
};
