import React from 'react';
import {
  MessageSquare,
  Clock,
  Heart,
  Tag,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { SidebarTab } from '../types/chat';
import { t } from '../../../i18n';

interface ChatSidebarProps {
  sidebarTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  conversationsCount: number;
  labels: string[];
  showAddLabel: boolean;
  onShowAddLabel: (show: boolean) => void;
  newLabelName: string;
  onNewLabelNameChange: (name: string) => void;
  onAddLabel: () => void;
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sidebarTab,
  onTabChange,
  conversationsCount,
  labels,
  showAddLabel,
  onShowAddLabel,
  newLabelName,
  onNewLabelNameChange,
  onAddLabel,
  collapsed,
  onCollapse,
}) => {
  return (
    <>
      <div
        className="border-r border-slate-200 flex flex-col bg-white shrink-0 transition-all duration-200"
        style={{ width: collapsed ? 0 : 200, overflow: 'hidden' }}
      >
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          <button
            onClick={() => onTabChange('all')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-semibold transition-all cursor-pointer ${sidebarTab === 'all' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <span className="flex items-center gap-2"><MessageSquare size={15} /> {t('crm.sidebar.all_chats')}</span>
            {conversationsCount > 0 && <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{conversationsCount}</span>}
          </button>
          <button
            onClick={() => onTabChange('reminders')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-semibold transition-all cursor-pointer ${sidebarTab === 'reminders' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Clock size={15} /> {t('crm.sidebar.reminders')}
          </button>
          <div className="pt-3">
            <div className="flex items-center justify-between px-3 py-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('crm.sidebar.labels')}</span>
              <button onClick={() => onShowAddLabel(true)} className="text-slate-400 hover:text-indigo-600 cursor-pointer"><Plus size={14} /></button>
            </div>
            {showAddLabel && (
              <div className="px-3 py-1 flex gap-1">
                <input
                  value={newLabelName}
                  onChange={e => onNewLabelNameChange(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && onAddLabel()}
                  placeholder={t('common.label_name_placeholder')}
                  autoFocus
                  className="flex-1 text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-indigo-400"
                />
                <button onClick={onAddLabel} className="text-indigo-600 cursor-pointer"><Plus size={14} /></button>
                <button onClick={() => { onShowAddLabel(false); onNewLabelNameChange(''); }} className="text-slate-400 cursor-pointer"><X size={14} /></button>
              </div>
            )}
            {labels.map(l => (
              <button
                key={l}
                onClick={() => onTabChange(l as SidebarTab)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer ${sidebarTab === l ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <Tag size={13} className={sidebarTab === l ? 'text-indigo-500' : 'text-slate-400'} />{l}
              </button>
            ))}
          </div>
          <button
            onClick={() => onTabChange('favorites')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-semibold transition-all cursor-pointer ${sidebarTab === 'favorites' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Heart size={15} className={sidebarTab === 'favorites' ? 'text-red-500 fill-red-500' : 'text-red-400'} /> {t('crm.sidebar.favorites')}
          </button>
        </nav>
        <div className="p-2 border-t border-slate-100 flex justify-end">
          <button onClick={() => onCollapse(true)} className="flex items-center justify-center p-1.5 border border-slate-200 rounded text-slate-400 hover:text-slate-600 cursor-pointer">
            <ChevronLeft size={16} /><ChevronLeft size={16} className="-ml-2" />
          </button>
        </div>
      </div>
      {collapsed && (
        <button onClick={() => onCollapse(false)} className="border-r border-slate-200 px-1 flex items-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer">
          <ChevronRight size={16} /><ChevronRight size={16} className="-ml-2" />
        </button>
      )}
    </>
  );
};
