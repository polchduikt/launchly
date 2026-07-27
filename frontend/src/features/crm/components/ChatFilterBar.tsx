import React from 'react';
import { MessageSquare, ChevronDown } from 'lucide-react';
import type { ChatFilter, SortOrder } from '../types/chat';
import { CHAT_FILTER_OPTIONS } from '../config/chat';
import { t } from '../../../i18n/config';

interface ChatFilterBarProps {
  chatFilter: ChatFilter;
  onChatFilterChange: (f: ChatFilter) => void;
  chatFilterLabel: string;
  showChatFilterDrop: boolean;
  onShowChatFilterDrop: (show: boolean) => void;
  filterRef: React.RefObject<HTMLDivElement | null>;
  showUnreadOnly: boolean;
  onShowUnreadOnlyChange: (show: boolean) => void;
  unreadCount: number;
  sortOrder: SortOrder;
  onSortOrderChange: (order: SortOrder) => void;
  showSortDrop: boolean;
  onShowSortDrop: (show: boolean) => void;
  sortRef: React.RefObject<HTMLDivElement | null>;
}

export const ChatFilterBar: React.FC<ChatFilterBarProps> = ({
  chatFilter,
  onChatFilterChange,
  chatFilterLabel: _chatFilterLabel,
  showChatFilterDrop,
  onShowChatFilterDrop,
  filterRef,
  showUnreadOnly,
  onShowUnreadOnlyChange,
  unreadCount,
  sortOrder,
  onSortOrderChange,
  showSortDrop,
  onShowSortDrop,
  sortRef,
}) => (
  <div className="h-12 border-b border-slate-200 flex items-center justify-between px-4 bg-white shrink-0 select-none relative z-20">
    <div className="flex items-center gap-1.5 py-1">

      <div ref={filterRef} className="relative shrink-0">
        <button
          onClick={() => { onShowChatFilterDrop(!showChatFilterDrop); onShowSortDrop(false); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-indigo-200 bg-indigo-50/50 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50 cursor-pointer"
        >
          <MessageSquare size={12} className="text-indigo-500" />
          {chatFilter === 'open' ? t('crm.chat.open_chats') : chatFilter === 'closed' ? t('crm.chat.closed_chats') : t('crm.chat.all_chats')} <ChevronDown size={11} />
        </button>
        {showChatFilterDrop && (
          <div className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 min-w-[140px]">
            {CHAT_FILTER_OPTIONS.map(f => (
              <button
                key={f.value}
                onClick={() => { onChatFilterChange(f.value); onShowChatFilterDrop(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs font-medium cursor-pointer ${chatFilter === f.value ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {f.value === 'open' ? t('crm.chat.open_chats') : f.value === 'closed' ? t('crm.chat.closed_chats') : t('crm.chat.all_chats')}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => onShowUnreadOnlyChange(!showUnreadOnly)}
        className={`px-2.5 py-1.5 rounded-md border text-[11px] font-semibold cursor-pointer transition-all shrink-0 ${
          showUnreadOnly ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
        }`}
      >
        {t('crm.chat.unread')} {unreadCount > 0 && <span className="ml-1 bg-indigo-500 text-white text-[9px] font-bold px-1 rounded-full">{unreadCount}</span>}
      </button>

      <div ref={sortRef} className="relative shrink-0">
        <button
          onClick={() => { onShowSortDrop(!showSortDrop); onShowChatFilterDrop(false); }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-[11px] font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
        >
          {sortOrder === 'newest' ? t('crm.chat.sort_newest') : t('crm.chat.sort_oldest')} <ChevronDown size={11} />
        </button>
        {showSortDrop && (
          <div className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 min-w-[110px]">
            <button onClick={() => { onSortOrderChange('newest'); onShowSortDrop(false); }} className={`w-full text-left px-3 py-1.5 text-xs font-medium cursor-pointer ${sortOrder === 'newest' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'}`}>{t('crm.chat.sort_newest_opt')}</button>
            <button onClick={() => { onSortOrderChange('oldest'); onShowSortDrop(false); }} className={`w-full text-left px-3 py-1.5 text-xs font-medium cursor-pointer ${sortOrder === 'oldest' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'}`}>{t('crm.chat.sort_oldest_opt')}</button>
          </div>
        )}
      </div>

      </div>
  </div>
);
