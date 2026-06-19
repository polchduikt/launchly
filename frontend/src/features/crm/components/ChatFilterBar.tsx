import React from 'react';
import { MessageSquare, ChevronDown, Plus } from 'lucide-react';
import type { ChatFilter, SortOrder } from '../types/chat';
import { CHAT_FILTER_OPTIONS } from '../config/chat';

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
  onResetFilters: () => void;
}

export const ChatFilterBar: React.FC<ChatFilterBarProps> = ({
  chatFilter,
  onChatFilterChange,
  chatFilterLabel,
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
  onResetFilters,
}) => (
  <div className="h-12 border-b border-slate-200 flex items-center justify-between px-4 bg-white shrink-0 select-none relative z-20">
    <div className="flex items-center gap-1.5 py-1">
      <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-3.5 h-3.5 mr-1 shrink-0" />

      <div ref={filterRef} className="relative shrink-0">
        <button
          onClick={() => { onShowChatFilterDrop(!showChatFilterDrop); onShowSortDrop(false); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-indigo-200 bg-indigo-50/50 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50 cursor-pointer"
        >
          <MessageSquare size={12} className="text-indigo-500" />
          {chatFilterLabel} <ChevronDown size={11} />
        </button>
        {showChatFilterDrop && (
          <div className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 min-w-[140px]">
            {CHAT_FILTER_OPTIONS.map(f => (
              <button
                key={f.value}
                onClick={() => { onChatFilterChange(f.value); onShowChatFilterDrop(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs font-medium cursor-pointer ${chatFilter === f.value ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {f.label}
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
        Unread {unreadCount > 0 && <span className="ml-1 bg-indigo-500 text-white text-[9px] font-bold px-1 rounded-full">{unreadCount}</span>}
      </button>

      <div ref={sortRef} className="relative shrink-0">
        <button
          onClick={() => { onShowSortDrop(!showSortDrop); onShowChatFilterDrop(false); }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-[11px] font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
        >
          Sort: {sortOrder === 'newest' ? 'Newest' : 'Oldest'} <ChevronDown size={11} />
        </button>
        {showSortDrop && (
          <div className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 min-w-[110px]">
            <button onClick={() => { onSortOrderChange('newest'); onShowSortDrop(false); }} className={`w-full text-left px-3 py-1.5 text-xs font-medium cursor-pointer ${sortOrder === 'newest' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'}`}>Newest</button>
            <button onClick={() => { onSortOrderChange('oldest'); onShowSortDrop(false); }} className={`w-full text-left px-3 py-1.5 text-xs font-medium cursor-pointer ${sortOrder === 'oldest' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'}`}>Oldest</button>
          </div>
        )}
      </div>

      <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-dashed border-slate-300 bg-white text-[11px] font-semibold text-slate-500 hover:border-indigo-300 hover:text-indigo-600 cursor-pointer shrink-0">
        <Plus size={10} /> Filter
      </button>
    </div>
    <button onClick={onResetFilters} className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer ml-4 shrink-0">Reset Filters</button>
  </div>
);
