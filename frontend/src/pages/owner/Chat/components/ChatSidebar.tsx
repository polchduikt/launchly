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
import type { SidebarTab } from '../../../../types/chat';
import { t } from '../../../../i18n/config';

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
        className="border-r-2 border-[#0A0A0A] flex flex-col bg-[#F2EBDD] shrink-0 transition-all duration-200 font-['JetBrains_Mono',monospace]"
        style={{ width: collapsed ? 0 : 200, overflow: 'hidden' }}
      >
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          <button
            onClick={() => onTabChange('all')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${sidebarTab === 'all' ? 'bg-[#0A0A0A] text-[#F2EBDD] border-2 border-[#0A0A0A]' : 'text-[#0A0A0A] hover:bg-white border-2 border-transparent'}`}
          >
            <span className="flex items-center gap-2"><MessageSquare size={14} /> {t('crm.sidebar.all_chats')}</span>
            {conversationsCount > 0 && <span className="bg-white text-[#0A0A0A] border border-[#0A0A0A] text-[10px] font-black px-1.5 py-0.5 rounded-md min-w-[20px] text-center">{conversationsCount}</span>}
          </button>
          <button
            onClick={() => onTabChange('reminders')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${sidebarTab === 'reminders' ? 'bg-[#0A0A0A] text-[#F2EBDD] border-2 border-[#0A0A0A]' : 'text-[#0A0A0A] hover:bg-white border-2 border-transparent'}`}
          >
            <Clock size={14} /> {t('crm.sidebar.reminders')}
          </button>
          <div className="pt-3">
            <div className="flex items-center justify-between px-3 py-1 font-['Anybody',sans-serif]">
              <span className="text-[11px] font-black text-[#0A0A0A] uppercase tracking-wider">{t('crm.sidebar.labels')}</span>
              <button onClick={() => onShowAddLabel(true)} className="text-[#0A0A0A] hover:opacity-70 cursor-pointer"><Plus size={14} /></button>
            </div>
            {showAddLabel && (
              <div className="px-3 py-1 flex gap-1 items-center">
                <input
                  value={newLabelName}
                  onChange={e => onNewLabelNameChange(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && onAddLabel()}
                  placeholder={t('common.label_name_placeholder')}
                  autoFocus
                  className="flex-1 w-0 min-w-0 text-xs border-2 border-[#0A0A0A] bg-white rounded-lg px-2 py-1 focus:outline-none font-bold text-[#0A0A0A]"
                />
                <button onClick={onAddLabel} className="text-[#0A0A0A] cursor-pointer shrink-0"><Plus size={14} /></button>
                <button onClick={() => { onShowAddLabel(false); onNewLabelNameChange(''); }} className="text-[#0A0A0A] cursor-pointer shrink-0"><X size={14} /></button>
              </div>
            )}
            {labels.map(l => (
              <button
                key={l}
                onClick={() => onTabChange(l as SidebarTab)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${sidebarTab === l ? 'bg-[#0A0A0A] text-[#F2EBDD] border-2 border-[#0A0A0A]' : 'text-[#0A0A0A] hover:bg-white border-2 border-transparent'}`}
              >
                <Tag size={13} className={sidebarTab === l ? 'text-[#F2EBDD]' : 'text-[#0A0A0A]'} />{l}
              </button>
            ))}
          </div>
          <button
            onClick={() => onTabChange('favorites')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${sidebarTab === 'favorites' ? 'bg-[#0A0A0A] text-[#F2EBDD] border-2 border-[#0A0A0A]' : 'text-[#0A0A0A] hover:bg-white border-2 border-transparent'}`}
          >
            <Heart size={14} className={sidebarTab === 'favorites' ? 'text-rose-500 fill-rose-500' : 'text-rose-600'} /> {t('crm.sidebar.favorites')}
          </button>
        </nav>
        <div className="p-2 border-t-2 border-[#0A0A0A] flex justify-end">
          <button onClick={() => onCollapse(true)} className="flex items-center justify-center p-1.5 border-2 border-[#0A0A0A] rounded-xl text-[#0A0A0A] hover:bg-white cursor-pointer bg-white">
            <ChevronLeft size={16} /><ChevronLeft size={16} className="-ml-2" />
          </button>
        </div>
      </div>
      {collapsed && (
        <button onClick={() => onCollapse(false)} className="border-r-2 border-[#0A0A0A] px-1 flex items-center text-[#0A0A0A] bg-[#F2EBDD] hover:bg-white cursor-pointer">
          <ChevronRight size={16} /><ChevronRight size={16} className="-ml-2" />
        </button>
      )}
    </>
  );
};
