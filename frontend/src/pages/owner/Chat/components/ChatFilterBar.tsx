import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { MessageSquare, ChevronDown } from 'lucide-react';
import type { ChatFilter, SortOrder } from '../../../../types/chat';
import { CHAT_FILTER_OPTIONS } from '../../../../const/chat';
import { t } from '../../../../i18n/config';

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
  onResetFilters?: () => void;
}

interface DropdownPortalProps {
  anchorRef: React.RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  minWidth?: number;
  children: React.ReactNode;
}

export const DropdownPortal: React.FC<DropdownPortalProps> = ({ anchorRef, isOpen, minWidth, children }) => {
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 4, left: rect.left });
    }
  }, [isOpen, anchorRef]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      style={{ top: coords.top, left: coords.left, minWidth: minWidth ?? 'auto' }}
      className="fixed bg-canvas border-2 border-ink rounded-xl shadow-brutal z-[9999] py-1 font-['JetBrains_Mono',monospace] overflow-hidden"
    >
      {children}
    </div>,
    document.body
  );
};

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
  <div className="h-12 border-b-2 border-ink flex items-center justify-between px-4 bg-canvas shrink-0 select-none font-['JetBrains_Mono',monospace]">
    <div className="flex items-center gap-2 py-1">

      <div ref={filterRef} className="shrink-0">
        <button
          onClick={() => { onShowChatFilterDrop(!showChatFilterDrop); onShowSortDrop(false); }}
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl border-2 border-ink bg-white text-xs font-black uppercase text-ink hover:bg-ink hover:text-canvas cursor-pointer transition-all"
        >
          <MessageSquare size={12} className="shrink-0" />
          {chatFilter === 'open' ? t('crm.chat.open_chats') : chatFilter === 'closed' ? t('crm.chat.closed_chats') : t('crm.chat.all_chats')} <ChevronDown size={11} />
        </button>
        <DropdownPortal anchorRef={filterRef} isOpen={showChatFilterDrop} minWidth={160}>
          {CHAT_FILTER_OPTIONS.map(f => (
            <button
              key={f.value}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChatFilterChange(f.value);
                onShowChatFilterDrop(false);
              }}
              className={`w-full text-left px-4 py-2 text-xs font-black uppercase cursor-pointer block whitespace-nowrap transition-colors ${
                chatFilter === f.value
                  ? 'bg-ink text-canvas'
                  : 'text-ink hover:bg-ink hover:text-canvas'
              }`}
            >
              {f.value === 'open' ? t('crm.chat.open_chats') : f.value === 'closed' ? t('crm.chat.closed_chats') : t('crm.chat.all_chats')}
            </button>
          ))}
        </DropdownPortal>
      </div>

      <button
        onClick={() => onShowUnreadOnlyChange(!showUnreadOnly)}
        className={`px-3 py-1 rounded-xl border-2 border-ink text-xs font-black uppercase cursor-pointer transition-all shrink-0 ${
          showUnreadOnly ? 'bg-ink text-canvas' : 'bg-white text-ink hover:bg-canvas'
        }`}
      >
        {t('crm.chat.unread')} {unreadCount > 0 && <span className="ml-1 bg-white text-ink border border-ink text-[10px] font-black px-1.5 py-0.5 rounded-md">{unreadCount}</span>}
      </button>

      <div ref={sortRef} className="shrink-0">
        <button
          onClick={() => { onShowSortDrop(!showSortDrop); onShowChatFilterDrop(false); }}
          className="flex items-center gap-1 px-3 py-1 rounded-xl border-2 border-ink bg-white text-xs font-black uppercase text-ink hover:bg-ink hover:text-canvas cursor-pointer transition-all"
        >
          {sortOrder === 'newest' ? t('crm.chat.sort_newest') : t('crm.chat.sort_oldest')} <ChevronDown size={11} />
        </button>
        <DropdownPortal anchorRef={sortRef} isOpen={showSortDrop} minWidth={140}>
          <button
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onSortOrderChange('newest'); onShowSortDrop(false); }}
            className={`w-full text-left px-4 py-2 text-xs font-black uppercase cursor-pointer block whitespace-nowrap transition-colors ${
              sortOrder === 'newest'
                ? 'bg-ink text-canvas'
                : 'text-ink hover:bg-ink hover:text-canvas'
            }`}
          >
            {t('crm.chat.sort_newest_opt')}
          </button>
          <button
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onSortOrderChange('oldest'); onShowSortDrop(false); }}
            className={`w-full text-left px-4 py-2 text-xs font-black uppercase cursor-pointer block whitespace-nowrap transition-colors ${
              sortOrder === 'oldest'
                ? 'bg-ink text-canvas'
                : 'text-ink hover:bg-ink hover:text-canvas'
            }`}
          >
            {t('crm.chat.sort_oldest_opt')}
          </button>
        </DropdownPortal>
      </div>

    </div>
  </div>
);
