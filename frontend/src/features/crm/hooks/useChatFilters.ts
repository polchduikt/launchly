import { useState, useMemo, useRef, useEffect } from 'react';
import type { BotUserResponse } from '../../../types/bot';
import type { ConversationResponse } from '../../../types/crm';
import type { ChatFilter, SortOrder, SidebarTab } from '../types/chat';
import { CHAT_FILTER_LABELS } from '../config/chat';

interface UseChatFiltersParams {
  conversations: ConversationResponse[];
  favorites: number[];
  unreadConvIds: number[];
  botUsers: BotUserResponse[];
}

export const useChatFilters = ({
  conversations,
  favorites,
  unreadConvIds,
  botUsers,
}: UseChatFiltersParams) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [chatFilter, setChatFilter] = useState<ChatFilter>('open');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('all');
  const [showSortDrop, setShowSortDrop] = useState(false);
  const [showChatFilterDrop, setShowChatFilterDrop] = useState(false);

  const filterRef = useRef<HTMLDivElement | null>(null);
  const sortRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setShowChatFilterDrop(false);
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSortDrop(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredConversations = useMemo(() => {
    let list = [...conversations];

    if (chatFilter === 'open') list = list.filter(c => c.status === 'OPEN');
    if (chatFilter === 'closed') list = list.filter(c => c.status === 'CLOSED');

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c =>
        c.botUserName.toLowerCase().includes(q) ||
        (c.botUserUsername && c.botUserUsername.toLowerCase().includes(q))
      );
    }

    if (showUnreadOnly) list = list.filter(c => c.unread);
    
    if (sidebarTab === 'favorites') {
      list = list.filter(c => favorites.includes(c.id));
    } else if (sidebarTab === 'reminders') {
      list = list.filter(c => {
        const u = botUsers.find(user => user.telegramId === c.botUserTelegramId);
        if (!u) return false;
        try {
          const meta = u.metadata ? JSON.parse(u.metadata) : {};
          return meta.reminderTime && meta.reminderTime > Date.now();
        } catch {
          return false;
        }
      });
    } else if (sidebarTab !== 'all') {
      list = list.filter(c => {
        const u = botUsers.find(user => user.telegramId === c.botUserTelegramId);
        if (!u) return false;
        try {
          const meta = u.metadata ? JSON.parse(u.metadata) : {};
          return meta.labels && meta.labels.includes(sidebarTab);
        } catch {
          return false;
        }
      });
    }

    list.sort((a, b) => {
      const tA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const tB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return sortOrder === 'newest' ? tB - tA : tA - tB;
    });

    return list;
  }, [conversations, chatFilter, searchQuery, showUnreadOnly, sortOrder, sidebarTab, favorites, botUsers]);

  const chatFilterLabel = CHAT_FILTER_LABELS[chatFilter] || 'All Chats';

  const resetFilters = () => {
    setSearchQuery('');
    setShowUnreadOnly(false);
    setSortOrder('newest');
    setChatFilter('open');
  };

  return {
    searchQuery,
    setSearchQuery,
    sortOrder,
    setSortOrder,
    chatFilter,
    setChatFilter,
    showUnreadOnly,
    setShowUnreadOnly,
    sidebarTab,
    setSidebarTab,
    showSortDrop,
    setShowSortDrop,
    showChatFilterDrop,
    setShowChatFilterDrop,
    filterRef,
    sortRef,
    filteredConversations,
    chatFilterLabel,
    resetFilters,
  };
};
